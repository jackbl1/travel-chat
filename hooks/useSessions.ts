import { useMutation, useQuery, useQueryClient } from "react-query";
import { apiRoutes } from "../lib/api-routes";
import { SessionInterface } from "@/lib/types";
import axios from "axios";

export const useGetSessions = (userId?: string) => {
  return useQuery({
    queryKey: ["sessions", userId],
    queryFn: async (): Promise<Array<SessionInterface>> => {
      const response = await fetch(`${apiRoutes.session}?userId=${userId}`);
      return await response.json();
    },
    enabled: !!userId,
  });
};

export const useAddSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    /**
     * Creates a new session.
     *
     * @param newSession - Object containing the session's details.
     * @returns The newly created session.
     */
    mutationFn: async (
      newSession: Omit<
        SessionInterface,
        "sessionId" | "createdAt" | "updatedAt"
      >
    ) => {
      const res = await axios.post(apiRoutes.session, newSession);
      return res.data;
    },
    onMutate: async (newSession) => {
      await queryClient.cancelQueries(["sessions", newSession.userId]);

      const previousSessions = queryClient.getQueryData<
        Array<SessionInterface>
      >(["sessions", newSession.userId]);

      // Create a temporary ID for optimistic update
      const tempSession = {
        ...newSession,
        id: `temp-${Date.now()}`,
      };

      queryClient.setQueryData<Array<SessionInterface>>(
        ["sessions", newSession.userId],
        (oldSessions) => [...(oldSessions || []), tempSession]
      );

      return { previousSessions };
    },
    onError: (error, newSession, context) => {
      if (context?.previousSessions) {
        queryClient.setQueryData<Array<SessionInterface>>(
          ["sessions", newSession.userId],
          context.previousSessions
        );
      }
    },
    onSettled: (data, _, newSession) => {
      if (data?.data) {
        queryClient.invalidateQueries(["sessions", newSession.userId]);
      }
    },
  });
};

export const useAddDetailsToSession = () => {
  return useMutation({
    mutationFn: async (payload: {
      sessionId: string;
      locations?: string[];
    }) => {
      return axios.post(
        `${apiRoutes.session}/${payload.sessionId}`,
        {
          locations: payload.locations,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    },
  });
};

export const useUpdateSession = () => {
  return useMutation({
    mutationFn: async (payload: {
      sessionId: string;
      locations?: string[];
      name?: string;
    }) => {
      return axios.patch(
        `${apiRoutes.session}/${payload.sessionId}`,
        { locations: payload.locations, name: payload.name },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    },
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      userId,
    }: {
      sessionId: string;
      userId: string;
    }) => {
      return axios.delete(`${apiRoutes.session}/${sessionId}`);
    },
    onMutate: async ({ sessionId, userId }) => {
      await queryClient.cancelQueries(["sessions", userId]);

      const previousSessions = queryClient.getQueryData<
        Array<SessionInterface>
      >(["sessions", userId]);

      queryClient.setQueryData<Array<SessionInterface>>(
        ["sessions", userId],
        (oldSessions) =>
          oldSessions?.filter((session) => session.sessionId !== sessionId) ||
          []
      );

      // Also cancel and remove any related message queries
      await queryClient.cancelQueries(["messages", sessionId]);
      queryClient.removeQueries(["messages", sessionId]);

      return { previousSessions };
    },
    onError: (error, { userId }, context) => {
      if (context?.previousSessions) {
        queryClient.setQueryData<Array<SessionInterface>>(
          ["sessions", userId],
          context.previousSessions
        );
      }
    },
    onSettled: (_, __, { userId }) => {
      queryClient.invalidateQueries(["sessions", userId]);
    },
  });
};
