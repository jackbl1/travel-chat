import {
  ContentBlock,
  Model,
  Usage,
} from "@anthropic-ai/sdk/resources/messages/messages.mjs";

export type LocationType = {
  name: string;
  placeholder?: string;
  geolocation?: LatLongType;
};

export type LatLongType = {
  lat: number;
  long: number;
};

export enum LocationDataType {
  ACTIVITY = "activity",
  ACCOMMODATION = "accommodation",
}

export type LocationDataInterface = {
  locationDataId: string;
  locationId: string;
  sessionId: string;
  name: string;
  url: string;
  type: LocationDataType;
  createdAt: string;
};

export type LocationDataInterfaceDB = {
  location_data_id: string;
  location_id: string;
  session_id: string;
  name: string;
  url: string;
  type: LocationDataType;
  created_at: string;
};

export type LocationInterface = {
  locationId: string;
  sessionId: string;
  name: string;
  region: string;
  country: string;
  description: string;
  createdAt: string;
};

export type LocationInterfaceDB = {
  location_id: string;
  session_id: string;
  name: string;
  region: string;
  country: string;
  description: string;
  created_at: string;
};

export type SessionInterface = {
  sessionId: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  locations?: string[];
};

export type SessionInterfaceDB = {
  session_id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  locations?: string[];
};

export type MessageInterface = {
  messageId: string;
  content: string;
  role: string;
  userId: string;
  sessionId: string;
  createdAt: string;
};

export type MessageInterfaceDB = {
  message_id: string;
  content: string;
  role: string;
  user_id: string;
  session_id: string;
  created_at: string;
};

export type ChatAnthropicResponse = {
  id: string;
  content: Array<ContentBlock>;
  model: Model;
  role: "assistant";
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use" | null;
  stop_sequence: string | null;
  type: "message";
  usage: Usage;
};

export type SearchResult = {
  name: string;
  url: string;
};
