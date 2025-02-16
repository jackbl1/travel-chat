import { createClient } from "@supabase/supabase-js";
import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { transformKeys } from "../utils";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = sessionCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { userId, name } = parsed.data;

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

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleError(error as Error);
  }
}

// GET handler by user id
export async function GET(request: NextRequest) {
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

    // Transform the data to camelCase before sending to frontend
    const transformedData = transformKeys(data);

    return NextResponse.json(transformedData);
  } catch (error) {
    return handleError(error as Error);
  }
}
