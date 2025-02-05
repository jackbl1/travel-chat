import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

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

// Request validation schemas
const sessionQuerySchema = z.object({
  userId: z.string().uuid(),
});

const sessionCreateSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

// Error handling utility
const handleError = (error: Error) => {
  console.error("API Error:", error);
  return NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  );
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = sessionCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    console.log("checkpoint 1");

    const { userId, name } = parsed.data;

    console.log("checkpoint 2");

    const { data, error } = await supabase
      .from("sessions")
      .insert([
        {
          session_id: uuidv4(),
          user_id: userId,
          name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    console.log("checkpoint 3");

    if (error) {
      throw error;
    }

    console.log("checkpoint 4", data);

    return NextResponse.json(data);
  } catch (error) {
    return handleError(error as Error);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = sessionQuerySchema.safeParse({
      userId: searchParams.get("userId"),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", parsed.data.userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleError(error as Error);
  }
}

// DELETE handler
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

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

// PATCH handler for updating sessions
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const body = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const updateSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
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
