import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { requireEnvVar, transformKeys } from "../utils";

// Supabase client initializations
const supabase = createClient(
  requireEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnvVar("NEXT_PUBLIC_SUPABASE_KEY")
);

// GET endpoint to fetch locations for a session
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID is required" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("session_id", sessionId);

    if (error) throw error;

    const formattedResults = transformKeys(data);

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new location
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, session_id, url, type } = body;

    if (!name || !session_id) {
      return NextResponse.json(
        { error: "Name and session_id are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("locations")
      .insert([
        {
          name,
          session_id,
          url: url || null,
          type: type || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    const formattedResults = transformKeys(data);

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}
