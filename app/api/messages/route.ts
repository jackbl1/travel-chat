import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Endpoint to get all messages for a given session ID
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// Endpoint to add a new message
export async function POST(request: Request) {
  const { sessionId, userId, sender, content, timestamp, locations } =
    await request.json();

  if (!sessionId || !userId || !sender || !content || !timestamp) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("messages")
    .insert([
      {
        session_id: sessionId,
        user_id: userId,
        sender,
        content,
        timestamp,
        locations,
      },
    ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
