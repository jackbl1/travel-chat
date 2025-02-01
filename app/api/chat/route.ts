import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [{ role: "user", content: message }],
    });

    return NextResponse.json({ reply: response.content[0].text });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
