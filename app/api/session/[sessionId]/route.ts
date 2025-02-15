import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Environment validation
const requireEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

// Supabase client initialization
const supabase = createClient(
  requireEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnvVar("NEXT_PUBLIC_SUPABASE_KEY")
);

// Error handling utility
const handleError = (error: Error) => {
  console.error("API Error:", error);
  return NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  );
};

// GET handler by session id
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleError(error as Error);
  }
}

// PATCH handler for updating sessions
export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    const body = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const updateSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      locations: z.array(z.string()).optional(),
    });

    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("sessions")
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleError(error as Error);
  }
}

// DELETE handler
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // First, delete all related messages
    const { error: messagesError } = await supabase
      .from("messages")
      .delete()
      .eq("session_id", sessionId);

    if (messagesError) {
      throw messagesError;
    }

    // Then delete the session
    const { error: sessionError } = await supabase
      .from("sessions")
      .delete()
      .eq("session_id", sessionId);

    if (sessionError) {
      throw sessionError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error as Error);
  }
}
