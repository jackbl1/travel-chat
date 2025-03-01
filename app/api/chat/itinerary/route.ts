import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { requireEnvVar } from "../../utils";
import {
  LocationDataInterfaceDB,
  LocationInterfaceDB,
  MessageInterfaceDB,
} from "@/lib/types";

const SYSTEM_PROMPT =
  "You are a travel planner that generates itineraries based on user instructions. " +
  "Given the context from previous messages and the provided locations, activities, and accommodations, " +
  "create a comprehensive day-by-day itinerary. Include specific activities and accommodations for each location, " +
  "ensuring a logical flow between destinations. Format the itinerary in a clean, easy-to-read structure.";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Supabase client initialization
const supabase = createClient(
  requireEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnvVar("NEXT_PUBLIC_SUPABASE_KEY")
);

async function fetchSessionData(sessionId: string) {
  const [messagesResponse, locationsResponse, locationDataResponse] =
    await Promise.all([
      supabase
        .from("messages")
        .select<"*", MessageInterfaceDB>()
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true }),
      supabase
        .from("locations")
        .select<"*", LocationInterfaceDB>("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true }),
      supabase
        .from("location_data")
        .select<"*", LocationDataInterfaceDB>()
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true }),
    ]);

  if (messagesResponse.error) {
    throw new Error(
      `Failed to fetch messages: ${messagesResponse.error.message}`
    );
  }
  if (locationsResponse.error) {
    throw new Error(
      `Failed to fetch locations: ${locationsResponse.error.message}`
    );
  }
  if (locationDataResponse.error) {
    throw new Error(
      `Failed to fetch location data: ${locationDataResponse.error.message}`
    );
  }

  return {
    messages: messagesResponse.data || [],
    locations: locationsResponse.data || [],
    locationData: locationDataResponse.data || [],
  };
}

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "Valid session ID is required" },
        { status: 400 }
      );
    }

    // Fetch all required data
    const { messages, locations, locationData } = await fetchSessionData(
      sessionId
    );

    if (!locations.length) {
      return NextResponse.json(
        { error: "No destinations found for this trip" },
        { status: 400 }
      );
    }

    // Format messages and separate location data by type
    const formattedMessages = messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    }));

    const activities = locationData.filter((l) => l.type === "activity");
    const accommodations = locationData.filter(
      (l) => l.type === "accommodation"
    );

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      system: SYSTEM_PROMPT,
      messages: [
        ...formattedMessages,
        {
          role: "user",
          content: `Destinations for this trip:
${locations.map((l) => `- ${l.name}, ${l.region}, ${l.country}`).join("\n")}`,
        },
        {
          role: "user",
          content: `Available activities:
${activities.map((a) => `- ${a.name} in ${a.name}`).join("\n")}`,
        },
        {
          role: "user",
          content: `Accommodation options:
${accommodations.map((a) => `- ${a.name} in ${a.name}`).join("\n")}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    if (!response?.content?.[0]?.text) {
      throw new Error(
        "Failed to generate itinerary: Invalid response from Anthropic"
      );
    }

    return NextResponse.json({ itinerary: response.content[0].text });
  } catch (error) {
    console.error("Error generating itinerary:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: `Failed to generate itinerary: ${errorMessage}` },
      { status: 500 }
    );
  }
}
