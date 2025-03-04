import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { requireEnvVar } from "../../utils";
import { ChatAnthropicResponse } from "@/lib/types";
import { TextBlock } from "@anthropic-ai/sdk/resources/index.mjs";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Supabase client initializations
const supabase = createClient(
  requireEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnvVar("NEXT_PUBLIC_SUPABASE_KEY")
);

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get the chat history for context
    // You'll need to implement this based on your database structure
    const { data, error } = await supabase
      .from("messages")
      .select()
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    const prompt = `Based on the following chat conversation about travel plans, generate a brief, descriptive name for this travel planning session (max 50 characters). The name should capture the essence of the destination or type of trip being discussed. Only return the name, nothing else. If no travel plans have been discussed, return "New Trip".

Chat history:
${data?.map((m) => `${m.role}: ${m.content}`).join("\n")}`;

    const response: ChatAnthropicResponse = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      messages: [
        {
          role: "assistant",
          content:
            "You are a helpful travel assistant that generates concise, descriptive session names based on chat conversations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 50,
      temperature: 0.7,
    });

    const sessionName = (response.content[0] as TextBlock).text.trim();

    return NextResponse.json({ name: sessionName });
  } catch (error) {
    console.error("Error generating session name:", error);
    return NextResponse.json(
      { error: "Failed to generate session name" },
      { status: 500 }
    );
  }
}
