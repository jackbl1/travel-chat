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
} from "@/lib/types";
import Anthropic from "@anthropic-ai/sdk";
import { MessageParam } from "@anthropic-ai/sdk/resources/index.mjs";
import Exa from "exa-js";

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

const performExaSearch = async (query: string): Promise<SearchResult[]> => {
  const result = await exa.searchAndContents(query, {
    text: true,
    type: "neural",
    useAutoprompt: false,
    numResults: 5,
  });
  return result.results.map((result) => ({
    name: result.title || "",
    url: result.url || "",
  }));
};

// LangChain tool definitions
const activityTool = tool(
  async ({ location }) => {
    const formattedResults = await performExaSearch(
      `The best activity to do in ${location} is: `
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
    const formattedResults = await performGoogleSearch(
      `Top rated accommodation in ${location} is: `
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
      /{\s*name:\s*([^,]+)\s*,\s*region:\s*([^,]+)\s*,\s*country:\s*([^}]+)\s*}/g;
    const locations: Partial<LocationInterface>[] = [];

    let match;
    while ((match = locationRegex.exec(textContent)) !== null) {
      const [_, name, region, country] = match;
      if (name && region && country) {
        locations.push({
          name: name.trim(),
          region: region.trim(),
          country: country.trim(),
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

    // Convert database messages to LangChain messages
    // const previousMessages = data
    //   .map((msg) => {
    //     if (msg.role === "user") {
    //       return new HumanMessage(msg.content);
    //     } else if (msg.role === "assistant") {
    //       return new AIMessage(msg.content);
    //     } else if (msg.role === "tool") {
    //       return new ToolMessage({
    //         content: msg.content,
    //         tool_call_id: msg.tool_call_id,
    //         name: msg.name,
    //       });
    //     }
    //   })
    //   .filter(Boolean);

    // Add the current message
    //const messages = [...previousMessages, new HumanMessage(message)];

    const anthropicMessages: MessageParam[] = parsePreviousMessages(data);

    const locationResponse = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2048,
      system:
        "You are an experienced travel agent helping the user to plan a trip. The user will provide you with some information about their trip and you will provider the user with a comma delimited list of locations recommended to visit during their trip. The list of locations will follow the format: [{name: location1, region: region1, country: country1}, {name: location2, region: region2, country: country2}, ...]. Do not include ANY text other than this list of locations. If the user's message is not related to planning a trip, simple return an empty list as such: []",
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
          }))
        )
        .select();

    if (insertLocationError) {
      console.error("Error inserting locations:", insertLocationError);
      throw insertLocationError;
    }

    // Process each location to generate activities and accommodations
    const locationDataToInsert: Omit<
      LocationDataInterfaceDB,
      "location_data_id"
    >[] = [];
    const timestamp = new Date().toISOString();

    // Process each location sequentially
    for (const location of insertedLocations) {
      console.log("processing location", location);
      const locationName = `${location.name}, ${location.region}, ${location.country}`;

      // Generate activities for this location
      const activityResponse = await activityTool.invoke({
        location: locationName,
      });
      const activityData = JSON.parse(activityResponse).activities || [];

      // Generate accommodations for this location
      const accommodationResponse = await accommodationsTool.invoke({
        location: locationName,
      });
      const accommodationData =
        JSON.parse(accommodationResponse).accommodations || [];

      // Add activities to database entries
      activityData.forEach((activity: SearchResult) => {
        locationDataToInsert.push({
          location_id: location.location_id,
          session_id: sessionId,
          name: activity.name,
          url: activity.url,
          type: LocationDataType.ACTIVITY,
          created_at: timestamp,
        });
      });

      // Add accommodations to database entries
      accommodationData.forEach((accommodation: SearchResult) => {
        locationDataToInsert.push({
          location_id: location.location_id,
          session_id: sessionId,
          name: accommodation.name,
          url: accommodation.url,
          type: LocationDataType.ACCOMMODATION,
          created_at: timestamp,
        });
      });
    }

    // Insert all location data into the database
    const { data: insertedLocationData, error: insertDataError } =
      await supabase
        .from("location_data")
        .insert(locationDataToInsert)
        .select();

    if (insertDataError) {
      console.error("Error inserting location data:", insertDataError);
      throw insertDataError;
    }

    // Generate final itinerary using Claude
    const finalResponse = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2048,
      system:
        "You are an experienced travel agent. Create a detailed day-by-day itinerary based on the locations, activities, and accommodations provided. Make it engaging and well-organized.",
      messages: [
        ...anthropicMessages,
        {
          role: "user",
          content: `Create a comprehensive travel itinerary for the following locations based on the top activities and accommodations found in the following search results:\n\n${JSON.stringify(
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

    const itinerary = finalResponse.content[0].text;

    return NextResponse.json({
      reply: itinerary,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
