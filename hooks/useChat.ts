import axios from "axios";
import { useMutation } from "react-query";

interface ChatResponse {
  reply: string;
  locations: string[];
}

interface SessionNameResponse {
  name: string;
}

export const useChat = () => {
  return useMutation({
    mutationFn: async ({
      sessionId,
      message,
    }: {
      sessionId: string;
      message: string;
    }): Promise<ChatResponse> => {
      const response = await axios.post("/api/chat", { sessionId, message });
      return response.data;
    },
  });
};

export const useGenerateSessionName = () => {
  return useMutation({
    mutationFn: async ({
      sessionId,
    }: {
      sessionId: string;
    }): Promise<SessionNameResponse> => {
      const response = await axios.post(`/api/chat/name`, { sessionId });
      return response.data;
    },
  });
};
