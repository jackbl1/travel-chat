import { createClient } from "@supabase/supabase-js";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import Exa from "exa-js";
import { google } from "googleapis";
import {
  LocationDataType,
  LocationInterface,
  LocationDataInterface,
  SearchResult,
} from "../types";
import { requireEnvVar } from "@/app/api/utils";

// Initialize clients
const supabase = createClient(
  requireEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnvVar("NEXT_PUBLIC_SUPABASE_KEY")
);
const exa = new Exa(requireEnvVar("EXA_API_KEY"));
const googleSearch = google.customsearch("v1");

// Helper functions
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

// Location Tools
export const addLocationTool = tool(
  async ({
    name,
    region,
    country,
    description,
    sessionId,
  }: Partial<LocationInterface>) => {
    const timestamp = new Date().toISOString();
    const { data, error } = await supabase
      .from("locations")
      .insert({
        location_id: uuidv4(),
        session_id: sessionId,
        name,
        region,
        country,
        description,
        created_at: timestamp,
      })
      .select()
      .single();

    if (error) throw error;
    return JSON.stringify(data);
  },
  {
    name: "add_location",
    description: "Add a new location to the database",
    schema: z.object({
      name: z.string(),
      region: z.string(),
      country: z.string(),
      description: z.string(),
      sessionId: z.string(),
    }),
  }
);

export const updateLocationTool = tool(
  async ({
    locationId,
    updates,
  }: {
    locationId: string;
    updates: Partial<LocationInterface>;
  }) => {
    const { data, error } = await supabase
      .from("locations")
      .update(updates)
      .eq("location_id", locationId)
      .select()
      .single();

    if (error) throw error;
    return JSON.stringify(data);
  },
  {
    name: "update_location",
    description: "Update an existing location",
    schema: z.object({
      locationId: z.string(),
      updates: z.object({
        name: z.string().optional(),
        region: z.string().optional(),
        country: z.string().optional(),
        description: z.string().optional(),
      }),
    }),
  }
);

export const deleteLocationTool = tool(
  async ({ locationId }: { locationId: string }) => {
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("location_id", locationId);

    if (error) throw error;
    return "Location deleted successfully";
  },
  {
    name: "delete_location",
    description: "Delete a location from the database",
    schema: z.object({
      locationId: z.string(),
    }),
  }
);

// Location Data Tools
export const addLocationDataTool = tool(
  async ({
    locationId,
    sessionId,
    name,
    url,
    type,
  }: Partial<LocationDataInterface>) => {
    const timestamp = new Date().toISOString();
    const { data, error } = await supabase
      .from("location_data")
      .insert({
        location_data_id: uuidv4(),
        location_id: locationId,
        session_id: sessionId,
        name,
        url,
        type,
        created_at: timestamp,
      })
      .select()
      .single();

    if (error) throw error;
    return JSON.stringify(data);
  },
  {
    name: "add_location_data",
    description: "Add new data (activity or accommodation) for a location",
    schema: z.object({
      locationId: z.string(),
      sessionId: z.string(),
      name: z.string(),
      url: z.string(),
      type: z.enum([LocationDataType.ACTIVITY, LocationDataType.ACCOMMODATION]),
    }),
  }
);

export const updateLocationDataTool = tool(
  async ({
    locationDataId,
    updates,
  }: {
    locationDataId: string;
    updates: Partial<LocationDataInterface>;
  }) => {
    const { data, error } = await supabase
      .from("location_data")
      .update(updates)
      .eq("location_data_id", locationDataId)
      .select()
      .single();

    if (error) throw error;
    return JSON.stringify(data);
  },
  {
    name: "update_location_data",
    description: "Update existing location data",
    schema: z.object({
      locationDataId: z.string(),
      updates: z.object({
        name: z.string().optional(),
        url: z.string().optional(),
      }),
    }),
  }
);

export const deleteLocationDataTool = tool(
  async ({ locationDataId }: { locationDataId: string }) => {
    const { error } = await supabase
      .from("location_data")
      .delete()
      .eq("location_data_id", locationDataId);

    if (error) throw error;
    return "Location data deleted successfully";
  },
  {
    name: "delete_location_data",
    description: "Delete location data from the database",
    schema: z.object({
      locationDataId: z.string(),
    }),
  }
);

// Search Tools
export const searchWebTool = tool(
  async ({
    query,
    type,
  }: {
    query: string;
    type: LocationDataType;
  }): Promise<SearchResult[]> => {
    try {
      // Try Exa search first
      const exaResults = await withRetry(() =>
        exa.search(query, {
          type: "neural",
          useAutoprompt: false,
          numResults: 3,
        })
      );
      let results: SearchResult[] = [];

      results = exaResults.results.map((result) => ({
        name: result.title || "",
        url: result.url || "",
      }));

      // Fallback to Google if Exa returns no results
      if (results.length === 0) {
        const googleResults = await googleSearch.cse.list({
          cx: requireEnvVar("GOOGLE_SEARCH_ENGINE_ID"),
          q: query,
          auth: requireEnvVar("GOOGLE_API_KEY"),
          num: 3,
        });

        results = (googleResults.data.items || []).map((item) => ({
          name: item.title || "",
          url: item.link || "",
        }));
      }

      return results;
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  },
  {
    name: "search_web",
    description: "Search the web for activities or accommodations",
    schema: z.object({
      query: z.string(),
      type: z.enum([LocationDataType.ACTIVITY, LocationDataType.ACCOMMODATION]),
    }),
  }
);
