import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
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

// Request validation schemas
const messageQuerySchema = z.object({
  sessionId: z.string().uuid(),
});

const messageCreateSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.string().min(1),
  content: z.string().min(1),
});

// Error handling utility
const handleError = (error: Error) => {
  console.error("API Error:", error);
  return NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  );
};

// GET handler
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = messageQuerySchema.safeParse({
      sessionId: searchParams.get("sessionId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", parsed.data.sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleError(error as Error);
  }
}

// POST handler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = messageCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { sessionId, userId, role, content } = parsed.data;

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          message_id: uuidv4(),
          session_id: sessionId,
          user_id: userId,
          role,
          content,
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
    return handleError(error as Error);
  }
}

// DELETE handler
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("message_id", messageId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error as Error);
  }
}
