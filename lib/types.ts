export type SessionInterface = CreateSessionInterface & {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateSessionInterface = {
  name: string;
  userId: string;
};

export type MessageInterface = AddMessageInterface & {
  messageId: string;
  createdAt: string;
};

export type AddMessageInterface = {
  content: string;
  sender: string;
  locations: string[];
  userId: string;
  sessionId: string;
};
