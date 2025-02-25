import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireEnvVar } from "../utils";
import { LocationDataInterface } from "@/lib/types";

// Initialize Supabase client
const supabase = createClient(
  requireEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnvVar("NEXT_PUBLIC_SUPABASE_KEY")
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Query location data from Supabase
    const { data, error } = await supabase
      .from("location_data")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching location data:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to match LocationDataInterface
    const locationData: LocationDataInterface[] = data.map((item) => ({
      locationDataId: item.location_data_id,
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
