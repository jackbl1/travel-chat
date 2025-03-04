import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireEnvVar } from "../utils";
import { google } from "googleapis";
import { ChatAnthropic } from "@langchain/anthropic";
import {
  HumanMessage,
  AIMessage,
  ToolMessage,
  MessageContentComplex,
  MessageContent,
} from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  LocationDataType,
  LocationDataInterface,
  LocationDataInterfaceDB,
  LocationInterface,
  MessageInterface,
  LocationInterfaceDB,
} from "@/lib/types";
import Anthropic from "@anthropic-ai/sdk";
import { MessageParam } from "@anthropic-ai/sdk/resources/index.mjs";
import Exa from "exa-js";
import { v4 as uuidv4 } from "uuid";

// Supabase client initializations
const supabase = createClient(
  requireEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnvVar("NEXT_PUBLIC_SUPABASE_KEY")
);

const googleSearch = google.customsearch("v1");

type SearchResult = {
  name: string;
  url: string;
};

// Helper function for Google Search API calls
async function performGoogleSearch(query: string): Promise<SearchResult[]> {
  try {
    const searchResponse = await googleSearch.cse.list({
      cx: requireEnvVar("GOOGLE_SEARCH_ENGINE_ID"),
      q: query,
      auth: requireEnvVar("GOOGLE_API_KEY"),
      num: 5,
    });

    return (searchResponse.data.items || []).map((item) => ({
      name: item.title || "",
      url: item.link || "",
    }));
  } catch (error) {
    console.error("Google Search API error:", error);
    return [];
  }
}

const exa = new Exa(requireEnvVar("EXA_API_KEY"));

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const performExaSearch = async (
  query: string,
  retries = 3,
  initialDelay = 1000
): Promise<SearchResult[]> => {
  try {
    const result = await exa.search(query, {
      type: "neural",
      useAutoprompt: false,
      numResults: 3,
    });
    return result.results.map((result) => ({
      name: result.title || "",
      url: result.url || "",
    }));
  } catch (error: any) {
    // Check if it's a rate limit error (429)
    if (retries > 0) {
      console.log(
        `Rate limited by Exa API, retrying in ${initialDelay}ms. Retries left: ${retries}`
      );
      await sleep(initialDelay);
      // Retry with exponential backoff
      return performExaSearch(query, retries - 1, initialDelay * 2);
    }
    // If it's not a rate limit error or we're out of retries, throw the error
    throw error;
  }
};

// LangChain tool definitions
const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (error?.response?.status === 429 && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(
          `Rate limited, retrying in ${delay}ms. Retries left: ${
            maxRetries - i - 1
          }`
        );
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

const activityTool = tool(
  async ({ location }) => {
    const formattedResults = await withRetry(() =>
      performExaSearch(`The best activity to do in ${location} is: `)
    );

    return JSON.stringify({
      activities: formattedResults,
    });
  },
  {
    name: "activity",
    description: "Get recommended activities with booking URLs",
    schema: z.object({
      location: z
        .string()
        .describe("The specific location to find activities for"),
    }),
  }
);

const accommodationsTool = tool(
  async ({ location }) => {
    const formattedResults = await withRetry(() =>
      performExaSearch(`Top rated accommodation in ${location} is: `)
    );

    return JSON.stringify({
      accommodations: formattedResults,
    });
  },
  {
    name: "accommodations",
    description: "Get recommended accommodations with booking URLs",
    schema: z.object({
      location: z.string().describe("The location to find accommodations in"),
    }),
  }
);

const anthropic = new Anthropic({
  apiKey: requireEnvVar("ANTHROPIC_API_KEY"),
});

const tools = [activityTool, accommodationsTool];

// Initialize LangChain Anthropic chat model
const llm = new ChatAnthropic({
  apiKey: requireEnvVar("ANTHROPIC_API_KEY"),
  modelName: "claude-3-haiku-20240307",
  temperature: 0,
});

const llmWithTools = llm.bindTools(tools);

function parseLocationResponse(
  response: MessageContent
): Partial<LocationInterface>[] {
  try {
    // Handle empty responses
    if (!response) {
      return [];
    }

    // Extract the text content from the complex message
    let textContent = "";
    if (typeof response === "string") {
      textContent = response;
    } else if (Array.isArray(response)) {
      const textPart = response.find(
        (part) =>
          typeof part === "object" && "type" in part && part.type === "text"
      );
      if (textPart && "text" in textPart) {
        textContent = textPart.text;
      }
    }

    // Return empty array if no text content or just brackets
    if (!textContent || textContent === "[]") {
      return [];
    }

    // Extract location objects using regex
    const locationRegex =
      /{\s*name:\s*([^,]+)\s*,\s*region:\s*([^,]+)\s*,\s*country:\s*([^,]+)\s*,\s*description:\s*([^}]+)\s*}/g;
    const locations: Partial<LocationInterface>[] = [];

    let match;
    while ((match = locationRegex.exec(textContent)) !== null) {
      const [_, name, region, country, description] = match;
      if (name && region && country) {
        locations.push({
          name: name.trim(),
          region: region.trim(),
          country: country.trim(),
          description: description.trim(),
        });
      }
    }

    return locations;
  } catch (error) {
    console.error("Error parsing location response:", error);
    console.error("Raw response:", response);
    return [];
  }
}

function parsePreviousMessages(data: MessageInterface[]): MessageParam[] {
  return data.map((message) => ({
    role: message.role === "user" ? "user" : "assistant",
    content: message.content,
  }));
}

export async function POST(request: Request) {
  try {
    const { sessionId, message, systemMessage } = await request.json();
    const timestamp = new Date().toISOString();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Fetch previous messages from the database
    const { data: existingMessages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      throw messagesError;
    }

    // If this is the first message and we have a system message, save it
    if (systemMessage && existingMessages.length === 0) {
      const { error: systemMessageError } = await supabase
        .from("messages")
        .insert({
          message_id: uuidv4(),
          session_id: sessionId,
          content: systemMessage,
          role: "agent",
          created_at: timestamp,
        });

      if (systemMessageError) {
        console.error("Error saving system message:", systemMessageError);
        throw systemMessageError;
      }
    }

    // Save the user's message
    const { error: userMessageError } = await supabase.from("messages").insert({
      message_id: uuidv4(),
      session_id: sessionId,
      content: message,
      role: "user",
      created_at: timestamp,
    });

    if (userMessageError) {
      console.error("Error saving user message:", userMessageError);
      throw userMessageError;
    }

    const anthropicMessages: MessageParam[] =
      parsePreviousMessages(existingMessages);

    const locationResponse = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2048,
      system:
        "You are an experienced travel agent helping the user to plan a trip. The user will provide you with some information about their trip and you will provider the user with a comma delimited list of locations recommended to visit during their trip. The list of locations will follow the format: [{name: location1, region: region1, country: country1, description: description1}, {name: location2, region: region2, country: country2, description: description2}, ...]. Do not include ANY text other than this list of locations. The description field should be an objective and brief 1-sentence description of the location. If the user's message is not related to planning a trip, return an empty list as such: []",
      messages: [...anthropicMessages, { role: "user", content: message }],
    });

    const uniqueLocations: Partial<LocationInterface>[] = parseLocationResponse(
      locationResponse.content
    );

    // Insert locations into the database
    const { data: insertedLocations, error: insertLocationError } =
      await supabase
        .from("locations")
        .insert(
          uniqueLocations.map((location) => ({
            name: location.name,
            session_id: sessionId,
            region: location.region,
            country: location.country,
            description: location.description,
          }))
        )
        .select();

    if (insertLocationError) {
      console.error("Error inserting locations:", insertLocationError);
      throw insertLocationError;
    }

    // Helper function to process a single location's data
    const processLocationData = async (
      location: Partial<LocationInterfaceDB>
    ) => {
      const locationName = `${location.name}, ${location.region}, ${location.country}`;

      try {
        // Run both API calls in parallel
        const [activityResponse, accommodationResponse] = await Promise.all([
          activityTool.invoke({ location: locationName }),
          accommodationsTool.invoke({ location: locationName }),
        ]);

        // Parse both responses
        const activityData = JSON.parse(activityResponse).activities || [];
        const accommodationData =
          JSON.parse(accommodationResponse).accommodations || [];

        // Convert results to database format
        const locationData: Omit<
          LocationDataInterfaceDB,
          "location_data_id"
        >[] = [
          ...activityData.map((activity: SearchResult) => ({
            location_id: location.location_id,
            session_id: sessionId,
            name: activity.name,
            url: activity.url,
            type: LocationDataType.ACTIVITY,
            created_at: timestamp,
          })),
          ...accommodationData.map((accommodation: SearchResult) => ({
            location_id: location.location_id,
            session_id: sessionId,
            name: accommodation.name,
            url: accommodation.url,
            type: LocationDataType.ACCOMMODATION,
            created_at: timestamp,
          })),
        ].filter((item) => item.name && item.url); // Filter out invalid entries

        return locationData;
      } catch (error) {
        console.error(`Error processing location ${locationName}:`, error);
        return []; // Return empty array on error
      }
    };

    // Process all locations concurrently and flatten results
    const locationDataArrays = await Promise.all(
      insertedLocations.map(processLocationData)
    );
    const locationDataToInsert = locationDataArrays.flat();

    let insertedLocationData = [];
    if (locationDataToInsert.length > 0) {
      try {
        // Insert all location data into the database
        const { data, error: insertDataError } = await supabase
          .from("location_data")
          .insert(locationDataToInsert)
          .select();

        if (insertDataError) {
          console.error("Error inserting location data:", insertDataError);
          // Continue with empty location data rather than failing
        } else {
          insertedLocationData = data;
        }
      } catch (error) {
        console.error("Error during location data insertion:", error);
        // Continue with empty location data rather than failing
      }
    }

    // Generate final itinerary using Claude
    let reply = "";
    try {
      const finalResponse = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 2048,
        system:
          "You are an experienced travel agent. Your goal is to help the user organize their travel plans with flights, activities and accommodations based on the trip details they request. Make your suggestions engaging and well-organized.",
        messages: [
          ...anthropicMessages,
          {
            role: "user",
            content: `Provide the user with suggestions for how to organize their trip, including flights, activites, and accommodations. This should not be an itinerary, but rather it should outline the top recommendations. The locations, top activities and accommodations can be found in the following search results:\n\n${JSON.stringify(
              {
                locations: insertedLocations,
                locationData: insertedLocationData,
              },
              null,
              2
            )}`,
          },
        ],
      });

      reply = finalResponse.content[0].text;

      // Save the agent's response
      const { error: agentMessageError } = await supabase
        .from("messages")
        .insert({
          message_id: uuidv4(),
          session_id: sessionId,
          content: reply,
          role: "agent",
          created_at: new Date().toISOString(),
        });

      if (agentMessageError) {
        console.error("Error saving agent message:", agentMessageError);
        throw agentMessageError;
      }
    } catch (error) {
      console.error("Error generating itinerary:", error);
      // Provide a basic response if itinerary generation fails
      reply = `Thank you for your travel request! I've identified ${insertedLocations.length} locations for your trip. However, I encountered some issues while generating the detailed itinerary. Please try again or modify your request.`;

      // Save the error response
      const { error: errorMessageError } = await supabase
        .from("messages")
        .insert({
          message_id: uuidv4(),
          session_id: sessionId,
          content: reply,
          role: "agent",
          created_at: new Date().toISOString(),
        });

      if (errorMessageError) {
        console.error("Error saving error message:", errorMessageError);
      }
    }

    return NextResponse.json({
      reply: reply,
      success: true,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
