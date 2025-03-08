import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { requireEnvVar } from "../utils";
import { ChatAnthropic } from "@langchain/anthropic";
import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  StateGraph,
  MessagesAnnotation,
  END,
  START,
} from "@langchain/langgraph";
import { z } from "zod";
import { MessageInterface } from "@/lib/types";
import {
  searchWebTool,
  addLocationTool,
  updateLocationTool,
  deleteLocationTool,
  addLocationDataTool,
  updateLocationDataTool,
  deleteLocationDataTool,
} from "@/lib/agents/tools";

// Define request schema using Zod
const RequestSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1),
  systemMessage: z.string().optional(),
});

interface ChatResponse {
  reply: string;
  success: boolean;
  error?: string;
}

interface MessageState {
  messages: BaseMessage[];
}

// Initialize clients as singletons
const supabase: SupabaseClient = createClient(
  requireEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnvVar("NEXT_PUBLIC_SUPABASE_KEY")
);

const tools = [
  addLocationTool,
  updateLocationTool,
  deleteLocationTool,
  addLocationDataTool,
  updateLocationDataTool,
  deleteLocationDataTool,
  searchWebTool,
];

const toolNodeForGraph = new ToolNode(tools);

const llm = new ChatAnthropic({
  apiKey: requireEnvVar("ANTHROPIC_API_KEY"),
  modelName: "claude-3-haiku-20240307",
  temperature: 0,
});

const llmWithTools = llm.bindTools(tools);

function parsePreviousMessages(data: MessageInterface[]): BaseMessage[] {
  return data.map((message) =>
    message.role === "user"
      ? new HumanMessage(message.content)
      : new AIMessage(message.content)
  );
}

const shouldContinue = (state: MessageState): typeof END | "tools" => {
  const lastMessage = state.messages[state.messages.length - 1];
  return lastMessage instanceof ToolMessage &&
    lastMessage.tool_call_id !== undefined
    ? "tools"
    : END;
};

const callModel = async (
  state: MessageState
): Promise<{ messages: BaseMessage[] }> => {
  const response = await llmWithTools.invoke(state.messages);
  return { messages: Array.isArray(response) ? response : [response] };
};

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNodeForGraph)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, ["tools", END])
  .addEdge("tools", "agent");

const app = workflow.compile();

export async function POST(
  request: Request
): Promise<NextResponse<ChatResponse>> {
  try {
    const body = await request.json();
    const { sessionId, message } = RequestSchema.parse(body);

    const { data: existingMessages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      throw new Error(`Database error: ${messagesError.message}`);
    }

    const streamWithMultiToolCalls = await app.stream(
      {
        messages: [
          ...parsePreviousMessages(existingMessages || []),
          new HumanMessage(message),
        ],
      },
      { streamMode: "values" }
    );

    let finalResponse = "";
    for await (const chunk of streamWithMultiToolCalls) {
      const lastMessage = chunk.messages[chunk.messages.length - 1];
      if (lastMessage instanceof AIMessage) {
        const content = lastMessage.content;
        finalResponse =
          typeof content === "string"
            ? content
            : Array.isArray(content)
            ? content
                .map((c) =>
                  typeof c === "string" ? c : "type" in c ? c.type : ""
                )
                .join(" ")
            : "";
      }
    }

    return NextResponse.json({
      reply: finalResponse,
      success: true,
    });
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request format", reply: "" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error", reply: "" },
      { status: 500 }
    );
  }
}
