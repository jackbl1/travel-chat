import { useDelete, useFetch, usePost } from "../utils/react-query";
import { apiRoutes } from "../lib/api-routes";
import { CreateSessionInterface, SessionInterface } from "@/lib/types";

export const useGetSessions = (userId: string) =>
  useFetch<SessionInterface[]>(apiRoutes.session, { userId });

export const useCreateSession = (
  updater: (
    oldData: SessionInterface[],
    newData: CreateSessionInterface
  ) => SessionInterface[]
) =>
  usePost<SessionInterface[], CreateSessionInterface>(
    apiRoutes.session,
    undefined,
    updater
  );

export const useDeleteSession = (sessionId: string) => {
  return useDelete<SessionInterface[]>(apiRoutes.session, { sessionId });
};
