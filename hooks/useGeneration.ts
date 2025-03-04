import { LocationDataInterface, LocationInterface } from "@/lib/types";
import axios from "axios";
import { useMutation } from "react-query";

interface ChatResponse {
  reply: string;
  locations: Partial<LocationInterface>[];
  activities: Partial<LocationDataInterface>[];
  accommodations: Partial<LocationDataInterface>[];
}

interface SessionNameResponse {
  name: string;
}

export const useChat = () => {
  return useMutation({
    mutationFn: async ({
      sessionId,
      message,
      systemMessage,
    }: {
      sessionId: string;
      message: string;
      systemMessage?: string;
    }): Promise<ChatResponse> => {
      const response = await axios.post("/api/chat", {
        sessionId,
        message,
        systemMessage,
      });
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

export const useGenerateItinerary = () => {
  return useMutation({
    mutationFn: async ({
      sessionId,
    }: {
      sessionId: string;
    }): Promise<string> => {
      const response = await axios.post(`/api/chat/itinerary`, { sessionId });
      return response.data.itinerary;
    },
  });
};
