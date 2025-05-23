"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/contexts/SupabaseContext";
import { useChat, useGenerateSessionName } from "@/hooks/useGeneration";
import { useDispatch, useSelector } from "react-redux";
import {
  getActiveSessionName,
  getActiveSessionId,
  setActiveSessionId,
} from "@/redux/sessionSlice";
import {
  useAddSession,
  useGetSessions,
  useUpdateSession,
} from "@/hooks/useSessions";
import { useGetMessages } from "@/hooks/useMessages";
import { MessageInterface } from "@/lib/types";
import { ChatMessages, ErrorMessage, LoadingMessage } from "./ChatMessages";
import { defaultMessageContent } from "@/lib/constants";
import { useGetLocations } from "@/hooks/useLocations";
import {
  savePendingQuery,
  getPendingQuery,
  clearPendingQuery,
} from "@/lib/pendingQuery";

const getRandomDefaultMessage = (): MessageInterface => ({
  messageId: "default",
  sessionId: "session1",
  userId: "user1",
  role: "agent",
  content:
    defaultMessageContent[
      Math.floor(Math.random() * defaultMessageContent.length)
    ],
  createdAt: new Date().toISOString(),
});

export const ChatInterface = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [firstMessageSent, setFirstMessageSent] = useState(false);
  const [attemptedNameGeneration, setAttemptedNameGeneration] = useState(false);
  const [startAnimation, setStartAnimation] = useState(true);
  const [defaultMessage] = useState<MessageInterface>(
    getRandomDefaultMessage()
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useSupabase();
  const router = useRouter();
  const { toast } = useToast();
  const { data: sessions, refetch: refetchSessions } = useGetSessions(user?.id);
  const activeSessionId = useSelector(getActiveSessionId);
  const dispatch = useDispatch();

  const {
    data: messages,
    isLoading: messagesLoading,
    isSuccess: messagesSuccess,
    refetch: refetchMessages,
  } = useGetMessages(activeSessionId);
  const { refetch: refetchLocations } = useGetLocations(activeSessionId);
  const addSessionMutation = useAddSession();
  const { mutateAsync: updateSession } = useUpdateSession();
  const chatMutation = useChat();
  const generateNameMutation = useGenerateSessionName();
  const activeSessionName = useSelector(getActiveSessionName);

  const generateName = useCallback(
    (sessionId: string) => {
      generateNameMutation.mutate(
        { sessionId },
        {
          onSuccess: async (nameResponse) => {
            await updateSession({
              sessionId,
              name: nameResponse.name,
            });
          },
          onError: (error) => {
            console.error("Failed to generate session name:", error);
          },
        }
      );
    },
    [generateNameMutation, updateSession]
  );

  useEffect(() => {
    if (messagesSuccess && messages.length > 0 && !firstMessageSent) {
      setFirstMessageSent(true);
      setStartAnimation(false);
      // Start the animation sequence after messages are loaded
      setTimeout(() => setStartAnimation(true), 100);
    }

    // Generate name for the session
    if (
      messagesSuccess &&
      messages.length > 2 &&
      activeSessionId &&
      !attemptedNameGeneration
    ) {
      if (activeSessionName?.match(/^Session \d+$/)) {
        setAttemptedNameGeneration(true);
        generateName(activeSessionId);
      }
    }

    // Scroll to the bottom when messages are loaded or updated
    const scrollArea = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (scrollArea && scrollRef.current) {
      const isAtBottom =
        Math.abs(
          scrollArea.scrollHeight -
            scrollArea.clientHeight -
            scrollArea.scrollTop
        ) < 1;

      if (isAtBottom) {
        setTimeout(
          () =>
            scrollRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "end",
            }),
          300
        );
      }
    }
  }, [
    messagesSuccess,
    messages,
    firstMessageSent,
    activeSessionId,
    activeSessionName,
    generateName,
    attemptedNameGeneration,
  ]);

  const [optimisticMessages, setOptimisticMessages] = useState<
    MessageInterface[]
  >([]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent, userInputOverride?: string) => {
      e.preventDefault();
      const messageContent = (userInputOverride ?? userInput).trim();
      setUserInput("");

      if (!messageContent) return;
      if (!user?.id) {
        // Save the query before redirecting
        savePendingQuery(messageContent);
        toast({
          title: "Sign in required",
          description: "Please sign in to continue chatting",
          variant: "default",
        });
        router.push("/sign-in");
        return;
      }

      setLoading(true);
      setError(false);

      try {
        // Create or get session ID
        let sessionId = activeSessionId;
        if (!sessionId) {
          const newSession = await addSessionMutation.mutateAsync({
            name: `Session ${(sessions?.length ?? 0) + 1}`,
            userId: user.id,
          });
          sessionId = newSession?.sessionId;
          if (!sessionId) {
            throw new Error("Failed to create new session");
          }
          dispatch(setActiveSessionId(newSession.sessionId));
        }

        // Optimistically add user message
        const optimisticUserMessage: MessageInterface = {
          messageId: `temp-${Date.now()}`,
          sessionId,
          userId: user.id,
          role: "user",
          content: messageContent,
          createdAt: new Date().toISOString(),
        };
        setOptimisticMessages((prev) => [...prev, optimisticUserMessage]);

        // Send message
        const data = await chatMutation.mutateAsync({
          sessionId,
          message: messageContent,
          systemMessage: !firstMessageSent ? defaultMessage.content : undefined,
        });

        setLoading(false);
      } catch (error) {
        console.error("Chat error:", error);
        setError(true);
        // Remove optimistic messages on error
        setOptimisticMessages([]);
      } finally {
        if (!firstMessageSent) {
          setFirstMessageSent(true);
        }
        // Update the session with the latest details that the agent has generated
        await refetchSessions();
        await refetchLocations();
        await refetchMessages();
        // Clear optimistic messages after successful update
        setOptimisticMessages([]);
      }
    },
    [
      activeSessionId,
      addSessionMutation,
      chatMutation,
      defaultMessage.content,
      dispatch,
      firstMessageSent,
      refetchLocations,
      refetchMessages,
      refetchSessions,
      router,
      sessions?.length,
      toast,
      user?.id,
      userInput,
    ]
  );

  // Check for pending query, and auto-run if one is found
  useEffect(() => {
    if (user?.id) {
      const pendingQuery = getPendingQuery();
      if (pendingQuery) {
        clearPendingQuery();
        // Small delay to ensure UI is ready
        setTimeout(() => {
          handleSubmit(new Event("submit") as any, pendingQuery);
        }, 100);
      }
    }
  }, [user?.id, handleSubmit]);

  // Prevent blank submissions and allow for multiline input
  const handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && userInput) {
      if (!e.shiftKey && userInput) {
        handleSubmit(e);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  if (messagesLoading)
    return (
      <div className="flex-1 flex flex-col h-screen relative">
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 overflow-y-auto">
          <div className="flex gap-2 max-w-[80%]">
            <Image
              src="/icon.webp"
              alt="Icon"
              className="h-6 w-6 rounded-full"
              width={32}
              height={32}
            />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Travel Chat</span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">Loading...</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    );

  return (
    <div className="flex-1 flex flex-col h-screen relative">
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4" ref={scrollRef}>
          <ChatMessages
            firstMessageSent={firstMessageSent}
            startAnimation={startAnimation}
            defaultMessage={defaultMessage}
            messages={[...(messages ?? []), ...optimisticMessages]}
          />
          {loading && <LoadingMessage />}
          {error && <ErrorMessage />}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Type a message as a customer"
            value={userInput}
            onKeyDown={handleEnter}
            onChange={(e) => setUserInput(e.target.value)}
            className="resize-none"
          />
          {loading ? (
            <Button className="px-8" disabled>
              Chatting...
            </Button>
          ) : (
            <Button className="px-8" onClick={handleSubmit}>
              Send
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
