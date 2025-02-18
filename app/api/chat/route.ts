import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { requireEnvVar } from "../utils";
import { MessageInterface } from "@/lib/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Supabase client initializations
const supabase = createClient(
  requireEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnvVar("NEXT_PUBLIC_SUPABASE_KEY")
);

function parseAgentResponse(responseText: string) {
  // Find the start of the list of locations
  const locationListStart = responseText.lastIndexOf("[");
  const locationListEnd = responseText.lastIndexOf("]");

  // No locations in the response, just return the text
  if (locationListStart === -1 || locationListEnd === -1) {
    return { itinerary: responseText, locations: [] };
  }

  // Extract the itinerary text and the list of locations
  const itineraryText = responseText.substring(0, locationListStart).trim();
  const locationListText = responseText
    .substring(locationListStart + 1, locationListEnd)
    .trim();

  // Split the location list into an array
  const locations = locationListText
    .split(",")
    .map((location) => location.trim());

  return { itinerary: itineraryText, locations };
}

function parsePreviousMessages(data: MessageInterface[]) {
  return data.map((message) => ({
    role: message.role === "user" ? "user" : "assistant",
    content: message.content,
  }));
}

export async function POST(request: Request) {
  try {
    const { sessionId, message } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Fetch previous messages from the database
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    console.log("fetched prev messages and appending to history");
    console.log(data);
    const previousMessages = parsePreviousMessages(data);

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2048,
      system:
        "You are an experienced travel agent helping the user to plan a trip. You will provider the user with an itinerary for their trip along with a comma delimited list of locations present in the itinerary. The list of locations will be at the very end of the message and follow the format: [location1, location2, location3, ...]. Do not include ANY text after this list of locations. If the user's message is not related to planning a trip, do not answer the user and instead ask the user if they would like any help planning a trip.",
      messages: [...previousMessages, { role: "user", content: message }],
    });

    // Parse the agent response into the text of the itinerary and the list of locations
    const parsedResponse = parseAgentResponse(response.content[0].text);

    return NextResponse.json({
      reply: parsedResponse.itinerary,
      locations: parsedResponse.locations,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
