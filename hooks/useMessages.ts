import { useMutation, useQuery, useQueryClient } from "react-query";
import { apiRoutes } from "../lib/api-routes";
import { MessageInterface } from "@/lib/types";
import axios from "axios";

export const useGetMessages = (sessionId: string) => {
  return useQuery({
    queryKey: ["messages", sessionId],
    queryFn: async (): Promise<Array<MessageInterface>> => {
      const response = await fetch(
        `${apiRoutes.messages}?sessionId=${sessionId}`
      );
      return await response.json();
    },
    enabled: !!sessionId,
  });
};

// TODO: Use this react query hook when the endpoint starts working
// export const useAddMessage = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (
//       message: Omit<MessageInterface, "messageId" | "createdAt">
//     ) => {
//       return axios.post(apiRoutes.messages, message);
//     },
//     onMutate: async (newMessage) => {
//       await queryClient.cancelQueries(["messages", newMessage.sessionId]);

//       const previousMessages = queryClient.getQueryData<
//         Array<MessageInterface>
//       >(["messages", newMessage.sessionId]);

//       queryClient.setQueryData<Array<MessageInterface>>(
//         ["messages", newMessage.sessionId],
//         (oldMessages) => [
//           ...(oldMessages ?? []),
//           {
//             ...newMessage,
//             messageId: `temp-${Date.now()}`,
//             createdAt: new Date().toISOString(),
//           },
//         ]
//       );

//       return { previousMessages };
//     },
//     onError: (error, newMessage, context) => {
//       if (context?.previousMessages) {
//         queryClient.setQueryData<Array<MessageInterface>>(
//           ["messages", newMessage.sessionId],
//           context.previousMessages
//         );
//       }
//     },
//     onSettled: (data) => {
//       if (data?.data) {
//         queryClient.invalidateQueries(["messages", data.data.sessionId]);
//       }
//     },
//   });
// };

// TODO: Use this react query hook when the endpoint starts working
// export const useDeleteMessage = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async ({
//       messageId,
//       sessionId,
//     }: {
//       messageId: string;
//       sessionId: string;
//     }) => {
//       return axios.delete(`${apiRoutes.messages}/${messageId}`);
//     },
//     onMutate: async ({ messageId, sessionId }) => {
//       await queryClient.cancelQueries(["messages", sessionId]);

//       const previousMessages = queryClient.getQueryData<
//         Array<MessageInterface>
//       >(["messages", sessionId]);

//       queryClient.setQueryData<Array<MessageInterface>>(
//         ["messages", sessionId],
//         (oldMessages) =>
//           oldMessages?.filter((msg) => msg.messageId !== messageId) || []
//       );

//       return { previousMessages };
//     },
//     onError: (error, { sessionId }, context) => {
//       if (context?.previousMessages) {
//         queryClient.setQueryData<Array<MessageInterface>>(
//           ["messages", sessionId],
//           context.previousMessages
//         );
//       }
//     },
//     onSettled: (_, __, { sessionId }) => {
//       queryClient.invalidateQueries(["messages", sessionId]);
//     },
//   });
// };
