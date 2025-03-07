import { ChatAnthropic } from "@langchain/anthropic";
import { MessageInterface } from "../types";
import { requireEnvVar } from "@/app/api/utils";
import {
  addLocationTool,
  updateLocationTool,
  deleteLocationTool,
  addLocationDataTool,
  updateLocationDataTool,
  deleteLocationDataTool,
  searchWebTool,
} from "./tools";
import { SYSTEM_PROMPT } from "./systemPrompts";
import { AIMessageChunk } from "@langchain/core/messages";

// Initialize LangChain chat model with tools
const tools = [
  addLocationTool,
  updateLocationTool,
  deleteLocationTool,
  addLocationDataTool,
  updateLocationDataTool,
  deleteLocationDataTool,
  searchWebTool,
];

const llm = new ChatAnthropic({
  apiKey: requireEnvVar("ANTHROPIC_API_KEY"),
  modelName: "claude-3-haiku-20240307",
  temperature: 0,
});

const llmWithTools = llm.bindTools(tools);

// Chat Agent class
export class ChatAgent {
  private readonly llm: ReturnType<typeof llm.bindTools>;

  constructor() {
    this.llm = llmWithTools;
  }

  async processMessage(
    message: string,
    sessionId: string,
    messageHistory: MessageInterface[]
  ): Promise<AIMessageChunk> {
    try {
      const response = await this.llm.invoke([
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        ...messageHistory.map((msg) => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        })),
        { role: "user", content: message },
      ]);

      return response;
    } catch (error) {
      console.error("Error processing message:", error);
      throw error;
    }
  }
}
