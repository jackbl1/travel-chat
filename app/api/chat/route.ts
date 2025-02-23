import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireEnvVar } from "../utils";
import { google } from "googleapis";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

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

    console.log("made google search successfully");
    console.log(query);
    console.log(searchResponse);

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
const locationTool = tool(
  async ({ destination }) => {
    const formattedResults = await performGoogleSearch(
      `best tourist attractions points of interest in ${destination} travel guide`
    );

    return JSON.stringify({
      location: destination,
      attractions: formattedResults,
    });
  },
  {
    name: "location",
    description:
      "Get a list of recommended locations to visit at the destination",
    schema: z.object({
      destination: z.string().describe("The main destination to explore"),
    }),
  }
);

const activityTool = tool(
  async ({ location }) => {
    const formattedResults = await performGoogleSearch(
      `top rated tours activities things to do in ${location} booking.com viator`
    );

    return JSON.stringify({
      [location]: {
        activities: formattedResults,
      },
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
  async ({ location, nights }) => {
    const formattedResults = await performGoogleSearch(
      `best hotels resorts in ${location} booking.com tripadvisor`
    );

    return JSON.stringify({
      [location]: {
        accommodations: formattedResults,
      },
    });
  },
  {
    name: "accommodations",
    description: "Get recommended accommodations with booking URLs",
    schema: z.object({
      location: z.string().describe("The location to find accommodations in"),
      nights: z.number().describe("Number of nights needed"),
    }),
  }
);

const tools = [locationTool, activityTool, accommodationsTool];

// Initialize LangChain Anthropic chat model
const llm = new ChatAnthropic({
  apiKey: requireEnvVar("ANTHROPIC_API_KEY"),
  modelName: "claude-3-haiku-20240307",
  temperature: 0,
});

const llmWithTools = llm.bindTools(tools);

interface PlaceInfo {
  name: string;
  url: string;
}

interface LocationData {
  locations: string[];
  activities: Record<string, PlaceInfo[]>;
  accommodations: Record<string, PlaceInfo[]>;
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

    console.log("tool data at the very end");
    console.log(toolData);

    return NextResponse.json({
      reply: itinerary,
      locations: [...new Set(toolData.locations)], // Remove duplicates
      activities: toolData.activities,
      accommodations: toolData.accommodations,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
