import { useDelete, useFetch, usePost } from "../utils/react-query";
import { apiRoutes } from "../lib/api-routes";
import { SessionInterface } from "@/lib/types";

export const useGetSessions = (userId: string) =>
  useFetch<SessionInterface[]>(apiRoutes.session, { userId });

export const useCreateSession = (
  updater: (
    oldData: SessionInterface[],
    newData: SessionInterface
  ) => SessionInterface[]
) =>
  usePost<SessionInterface[], SessionInterface>(
    apiRoutes.session,
    undefined,
    updater
  );

export const useDeleteSession = (sessionId: string) => {
  return useDelete<SessionInterface[]>(apiRoutes.session, { sessionId });
};
