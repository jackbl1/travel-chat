export type SessionInterface = {
  sessionId: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type MessageInterface = {
  messageId: string;
  content: string;
  role: string;
  locations: string[];
  userId: string;
  sessionId: string;
  createdAt: string;
};
