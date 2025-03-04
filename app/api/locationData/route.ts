import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireEnvVar } from "../utils";
import { LocationDataInterface } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

// Initialize Supabase client
const supabase = createClient(
  requireEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnvVar("NEXT_PUBLIC_SUPABASE_KEY")
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const locationId = searchParams.get("locationId");

    if (!sessionId && !locationId) {
      return NextResponse.json(
        { error: "Either Session ID or Location ID is required" },
        { status: 400 }
      );
    }

    // Initialize query
    let query = supabase.from("location_data").select("*");

    // Apply the appropriate filter based on the provided ID
    if (sessionId) {
      query = query.eq("session_id", sessionId);
    } else if (locationId) {
      query = query.eq("location_id", locationId);
    }

    // Execute query with ordering
    const { data, error } = await query.order("created_at", {
      ascending: true,
    });

    if (error) {
      console.error("Error fetching location data:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to match LocationDataInterface
    const locationData: LocationDataInterface[] = data.map((item) => ({
      locationDataId: item.location_data_id,
      locationId: item.location_id,
      sessionId: item.session_id,
      name: item.name,
      url: item.url,
      type: item.type,
      createdAt: item.created_at,
    }));

    return NextResponse.json(locationData);
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to fetch location data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { locationId, sessionId, name, url, type } = body;

    if (!locationId || !sessionId || !name || !url || !type) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("location_data")
      .insert([
        {
          location_data_id: uuidv4(),
          location_id: locationId,
          session_id: sessionId,
          name,
          url,
          type,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to create location data" },
      { status: 500 }
    );
  }
}
