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

// Supabase client initializations
const supabase = createClient(
  requireEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnvVar("NEXT_PUBLIC_SUPABASE_KEY")
);

const googleSearch = google.customsearch("v1");

// Helper function for Google Search API calls
async function performGoogleSearch(query: string): Promise<PlaceInfo[]> {
  try {
    const searchResponse = await googleSearch.cse.list({
      cx: requireEnvVar("GOOGLE_SEARCH_ENGINE_ID"),
      q: query,
      auth: requireEnvVar("GOOGLE_API_KEY"),
      num: 5,
    });

    // TODO: improve search here, google is bad
    //console.log("made google search successfully");
    //console.log(query);
    //console.log(searchResponse);

    return (searchResponse.data.items || []).map((item) => ({
      name: item.title,
      url: item.link,
    }));
  } catch (error) {
    console.error("Google Search API error:", error);
    return [];
  }
}

// LangChain tool definitions
// const locationTool = tool(
//   async ({ destination }) => {
//     const formattedResults = await performGoogleSearch(
//       `best tourist attractions points of interest in ${destination} travel guide`
//     );

//     return JSON.stringify({
//       location: destination,
//       attractions: formattedResults,
//     });
//   },
//   {
//     name: "location",
//     description:
//       "Get a list of recommended locations to visit at the destination",
//     schema: z.object({
//       destination: z.string().describe("The main destination to explore"),
//     }),
//   }
// );

const activityTool = tool(
  async ({ location }) => {
    const formattedResults = await performGoogleSearch(
      `The best activity to do in ${location}`
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
      `Top rated hotel in ${location}`
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

const tools = [
  //locationTool,
  activityTool,
  accommodationsTool,
];

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

interface PlaceInfo {
  name: string;
  url: string;
}

interface LocationData {
  locations: string[];
  activities: Record<string, PlaceInfo[]>;
  accommodations: Record<string, PlaceInfo[]>;
}

interface ChatResponse {
  reply: string;
  locations: LocationInterface[];
  activities: LocationDataInterface[];
  accommodations: LocationDataInterface[];
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
    const previousMessages = data
      .map((msg) => {
        if (msg.role === "user") {
          return new HumanMessage(msg.content);
        } else if (msg.role === "assistant") {
          return new AIMessage(msg.content);
        } else if (msg.role === "tool") {
          return new ToolMessage({
            content: msg.content,
            tool_call_id: msg.tool_call_id,
            name: msg.name,
          });
        }
      })
      .filter(Boolean);

    // Add the current message
    const messages = [...previousMessages, new HumanMessage(message)];

    const anthropicMessages: MessageParam[] = parsePreviousMessages(data);

    const locationResponse = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2048,
      system:
        "You are an experienced travel agent helping the user to plan a trip. The user will provide you with some information about their trip and you will provider the user with a comma delimited list of locations recommended to visit during their trip. The list of locations will follow the format: [{name: location1, region: region1, country: country1}, {name: location2, region: region2, country: country2}, ...]. Do not include ANY text other than this list of locations. If the user's message is not related to planning a trip, simple return an empty list as such: []",
      messages: [...anthropicMessages, { role: "user", content: message }],
    });

    console.log("location response generated", locationResponse);

    const uniqueLocations: LocationInterface[] = parseLocationResponse(
      locationResponse.content
    );

    console.log("unique locations", uniqueLocations);

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

    // Get initial response
    let response = await llmWithTools.invoke(messages, {
      system: `You are an experienced travel agent helping users plan trips. You must use the following tools in order:
1. Use the 'location' tool to get recommended locations for the destination
2. Use the 'activity' tool for each major location to get activity recommendations
3. Use the 'accommodations' tool to find places to stay

After calling all of these tools to gather context, send the user a full itinerary for their travel including desintations, activities, and accommodations for each day. Format your response as a concise and readable travel itinerary.`,
    });

    messages.push(response);

    // Process tool calls until no more are requested
    while (response.tool_calls && response.tool_calls.length > 0) {
      const toolResults = await Promise.all(
        response.tool_calls.map(async (toolCall) => {
          const tool = tools.find((t) => t.name === toolCall.name);
          if (!tool) throw new Error(`Tool ${toolCall.name} not found`);
          return tool.invoke(toolCall);
        })
      );

      // Add tool results to messages
      messages.push(...toolResults);

      // Get next response
      response = await llmWithTools.invoke(messages);
      messages.push(response);
    }

    // Extract data from tool calls
    const toolData: LocationData = {
      locations: [],
      activities: {},
      accommodations: {},
    };

    // Helper function to safely parse JSON
    function safeJSONParse(content: string) {
      try {
        return JSON.parse(content);
      } catch (e) {
        console.error(`Error parsing JSON: ${content}`, e);
        return null;
      }
    }

    // Helper function to validate PlaceInfo array
    function isValidPlaceInfoArray(arr: any): arr is PlaceInfo[] {
      return (
        Array.isArray(arr) &&
        arr.every(
          (item) =>
            typeof item === "object" &&
            typeof item.name === "string" &&
            typeof item.url === "string"
        )
      );
    }

    // Process all messages to extract structured data
    for (const message of messages) {
      if (!(message instanceof ToolMessage)) continue;

      const result = safeJSONParse(message.content);
      if (!result) continue;

      try {
        // Handle location tool result
        if (result.location && result.attractions) {
          if (isValidPlaceInfoArray(result.attractions)) {
            toolData.locations.push(result.location);
          }
          continue;
        }

        // Handle activity/accommodation tool results
        const location = Object.keys(result)[0];
        if (!location) continue;

        const locationData = result[location];
        if (!locationData) continue;

        if (
          locationData.activities &&
          isValidPlaceInfoArray(locationData.activities)
        ) {
          toolData.activities[location] = locationData.activities;
        }

        if (
          locationData.accommodations &&
          isValidPlaceInfoArray(locationData.accommodations)
        ) {
          toolData.accommodations[location] = locationData.accommodations;
        }
      } catch (e) {
        console.error(`Error processing tool result: ${message.content}`, e);
      }
    }

    // Get the final response text
    const itinerary = response.content;

    // Save messages to database
    const messagesToSave = messages
      .map((msg) => {
        const baseMessage = {
          session_id: sessionId,
          created_at: new Date().toISOString(),
          content: msg instanceof AIMessage ? msg.content : msg.content,
        };

        if (msg instanceof HumanMessage) {
          return { ...baseMessage, role: "user" };
        } else if (msg instanceof AIMessage) {
          return { ...baseMessage, role: "assistant" };
        } else if (msg instanceof ToolMessage) {
          return {
            ...baseMessage,
            role: "tool",
            tool_call_id: msg.tool_call_id,
            name: msg.name,
          };
        }
      })
      .filter(Boolean);

    await supabase.from("messages").insert(messagesToSave);

    // Create session data objects for locations, activities, and accommodations
    const locationDataToInsert: Omit<
      LocationDataInterfaceDB,
      "location_data_id"
    >[] = [];
    const timestamp = new Date().toISOString();

    // Process activities
    for (const activities of Object.values(toolData.activities)) {
      for (const activity of activities) {
        locationDataToInsert.push({
          session_id: sessionId,
          name: activity.name,
          url: activity.url,
          type: LocationDataType.ACTIVITY,
          created_at: timestamp,
        });
      }
    }

    // Process accommodations
    for (const accommodations of Object.values(toolData.accommodations)) {
      for (const accommodation of accommodations) {
        locationDataToInsert.push({
          session_id: sessionId,
          name: accommodation.name,
          url: accommodation.url,
          type: LocationDataType.ACCOMMODATION,
          created_at: timestamp,
        });
      }
    }

    console.log("location data to insert:", locationDataToInsert);

    // Insert all session data into the database
    const { data: insertedLocationData, error: insertDataError } =
      await supabase
        .from("location_data")
        .insert(locationDataToInsert)
        .select();

    if (insertDataError) {
      console.error("Error inserting session data:", insertDataError);
      throw insertDataError;
    }

    // Transform the inserted data to match SessionDataInterface
    const transformedLocationData = insertedLocationData.map((item) => ({
      locationDataId: item.location_data_id,
      sessionId: item.session_id,
      name: item.name,
      url: item.url,
      type: item.type,
      createdAt: item.created_at,
    }));

    // Group the transformed data by type for the response
    const returnData = transformedLocationData.reduce(
      (acc, item) => {
        switch (item.type) {
          case LocationDataType.ACTIVITY:
            acc.activities = [...(acc.activities || []), item];
            break;
          case LocationDataType.ACCOMMODATION:
            acc.accommodations = [...(acc.accommodations || []), item];
            break;
        }
        return acc;
      },
      { activities: [], accommodations: [] }
    );

    //TODO: use supabase to store session data

    return NextResponse.json({
      reply: itinerary,
      locations: insertedLocations,
      activities: returnData.activities,
      accommodations: returnData.accommodations,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
