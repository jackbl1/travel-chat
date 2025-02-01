import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function parseAgentResponse(responseText: string) {
  // Find the start of the list of locations
  const locationListStart = responseText.lastIndexOf("[");
  const locationListEnd = responseText.lastIndexOf("]");

  if (locationListStart === -1 || locationListEnd === -1) {
    throw new Error("Invalid response format: Missing location list");
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

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      system:
        "You are an experienced travel agent helping the user to plan a trip. You will provider the user with an itinerary for their trip along with a comma delimited list of locations present in the itinerary. The list of locations will be at the very end of the message and follow the format: [location1, location2, location3, ...]. Do not include ANY text after this list of locations. If the user's message is not related to planning a trip, do not answer the user and instead ask the user if they would like any help planning a trip.",
      messages: [{ role: "user", content: message }],
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
