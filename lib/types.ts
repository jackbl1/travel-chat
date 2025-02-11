export type LocationType = {
  name: string;
  placeholder?: string;
  geolocation?: LatLongType;
};

export type LatLongType = {
  lat: number;
  long: number;
};

export type SessionInterface = {
  sessionId: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
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
