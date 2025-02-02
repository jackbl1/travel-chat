import { useDelete, useFetch, usePost } from "../utils/react-query";
import { apiRoutes } from "../lib/api-routes";
import { AddMessageInterface, MessageInterface } from "@/lib/types";

export const useGetMessages = (sessionId: string) =>
  useFetch<MessageInterface[]>(apiRoutes.messages, { sessionId });

export const useAddMessage = (
  updater: (
    oldData: MessageInterface[],
    newData: AddMessageInterface
  ) => MessageInterface[]
) =>
  usePost<MessageInterface[], AddMessageInterface>(
    apiRoutes.messages,
    undefined,
    updater
  );

export const useDeleteMessage = (messageId: string) => {
  return useDelete<MessageInterface[]>(apiRoutes.messages, { messageId });
};
