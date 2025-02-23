export type LocationType = {
  name: string;
  placeholder?: string;
  geolocation?: LatLongType;
};

export type LatLongType = {
  lat: number;
  long: number;
};

export enum SessionDataType {
  LOCATION = "location",
  ACTIVITY = "activity",
  ACCOMMODATION = "accommodation",
}

export type SessionDataInterface = {
  name: string;
  url: string;
  type: SessionDataType;
  createdAt: string;
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
