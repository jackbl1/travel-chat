"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatMessageDate } from "@/lib/utils";
import Image from "next/image";
import { useSupabase } from "@/contexts/SupabaseContext";
import { useChat, useGenerateSessionName } from "@/hooks/useChat";
import { useDispatch, useSelector } from "react-redux";
import { getActiveSessionId, setActiveSessionId } from "@/redux/itinerarySlice";
import {
  useAddSession,
  useGetSessions,
  useUpdateSession,
} from "@/hooks/useSessions";
import { useAddMessage, useGetMessages } from "@/hooks/useMessages";
import { MessageInterface } from "@/lib/types";
import { UserIcon } from "lucide-react";

const defaultMessageContent = [
  "How about a stay in Costa Rica's lush jungle?",
  "The Himalayas are nice this time of year.",
  "What about a trip to the Mediterranean?",
  "The Galapagos are full of unique wildlife.",
  "The Appalachians hide lovely mountain towns.",
  "Iceland's northern lights are simply magical.",
  "The Great Barrier Reef is calling your name.",
  "Explore the mysteries of the Amazon rainforest.",
  "Experience the ancient wonders of Kyoto.",
  "Paris is always a good idea, isn't it?",
  "Morocco's markets are a feast for the senses.",
  "Discover the hidden gems of old Havana.",
  "Walk the cobblestone streets of Prague.",
  "Explore the temples of Angkor Wat.",
  "The markets of Istanbul await your visit, my friend.",
  "Feel the rhythm of Rio de Janeiro.",
  "New Zealand's fjords are an adventurer's dream.",
  "Trek through Patagonia's untamed wilderness.",
  "Safari through Tanzania's Serengeti Plains.",
  "Dive into the crystal waters of the Maldives.",
  "Hike the breathtaking trails of Banff.",
  "Experience the majesty of the Norwegian fjords.",
  "Discover the hidden beaches of Thailand.",
  "Explore Vietnam's stunning Ha Long Bay.",
  "Find tranquility in Bhutan's mountain monasteries.",
  "Wander through Croatia's lavender fields.",
  "Discover the quiet beauty of Slovenia's lakes.",
  "Experience the magic of Myanmar's temples.",
  "Explore Colombia's coffee country.",
  "Trek through Nepal's remote villages.",
  "Find peace in Tuscany's rolling hills.",
  "Discover the wild beauty of Scotland's Highlands.",
];

const errorMessage: MessageInterface = {
  messageId: "error",
  sessionId: "session1",
  userId: "user1",
  role: "agent",
  content: "An error occurred while processing your request.",
  createdAt: new Date().toISOString(),
};

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
  const [defaultMessage] = useState(getRandomDefaultMessage);
  const [firstMessageSent, setFirstMessageSent] = useState(false);

  const { user } = useSupabase();
  const { data: sessions, refetch: refetchSessions } = useGetSessions(user?.id);
  const activeSessionId = useSelector(getActiveSessionId);
  const dispatch = useDispatch();

  const {
    data: messages,
    refetch: refetchMessages,
    isLoading: messagesLoading,
    isSuccess: messagesSuccess,
  } = useGetMessages(activeSessionId);
  const addMessageMutation = useAddMessage();
  const addSessionMutation = useAddSession();
  const { mutateAsync: updateSession } = useUpdateSession();
  const chatMutation = useChat();
  const generateNameMutation = useGenerateSessionName();

  useEffect(() => {
    if (messagesSuccess && messages.length > 0 && !firstMessageSent) {
      setFirstMessageSent(true);
    }
  }, [messagesSuccess, messages, firstMessageSent]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageContent = userInput.trim();
    setUserInput("");

    if (!messageContent) return;
    // TODO: Ask the user to sign in before sending message
    if (!user?.id) return;

    setLoading(true);
    setError(false);

    try {
      // 1. Create or get session ID
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
        await refetchSessions();
      }

      // 2. Add user message first, then get AI response
      if (!firstMessageSent) {
        await addMessageMutation.mutateAsync({
          sessionId,
          content: defaultMessage.content,
          role: "agent",
          userId: user.id,
        });
        setFirstMessageSent(true);
      }
      await addMessageMutation.mutateAsync({
        sessionId,
        content: messageContent,
        role: "user",
        userId: user.id,
      });

      // 3. Process AI response and update session
      // Start all async operations in parallel
      const data = await chatMutation.mutateAsync({ message: messageContent });

      // Wait for both the session update and message addition
      await Promise.all([
        updateSession({
          sessionId,
          locations: data.locations,
        }),
        addMessageMutation.mutateAsync({
          sessionId,
          content: data.reply,
          role: "agent",
          userId: user.id,
        }),
        refetchSessions(),
      ]);

      // Clear loading state after agent message is added
      setLoading(false);

      // 4. Handle session renaming if needed
      // TODO: Fix so that first message can rename session
      const currentSession = sessions?.find((s) => s.sessionId === sessionId);
      if (currentSession?.name.match(/^Session \d+$/)) {
        console.log("entering the generate name mutation?");
        generateNameMutation.mutate(
          { sessionId: sessionId },
          {
            onSuccess: async (nameResponse) => {
              try {
                await updateSession({
                  sessionId: sessionId,
                  name: nameResponse.name,
                });
              } catch (error) {
                console.error("Failed to update session name:", error);
              }
            },
            onError: (error) => {
              console.error("Failed to generate session name:", error);
            },
          }
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      setError(true);
    } finally {
      // Ensure we have the latest messages
      await refetchMessages();
    }
  };

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
    );

  return (
    <div className="flex-1 flex flex-col h-screen relative">
      <ScrollArea className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {!messages ? (
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
                  <span className="text-sm text-muted-foreground">
                    {formatMessageDate(defaultMessage.createdAt)}
                  </span>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {defaultMessage.content}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            messages?.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-2 max-w-[80%]",
                  message.role === "user" && "ml-auto justify-end"
                )}
              >
                {message.role === "agent" && (
                  <Image
                    src="/icon.webp"
                    alt="Icon"
                    className="h-6 w-6 rounded-full"
                    width={32}
                    height={32}
                  />
                )}
                {message.role === "user" && (
                  <UserIcon className="h-4 w-4 rounded-full" />
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {message.role === "agent" ? "Travel Chat" : "User"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatMessageDate(message.createdAt)}
                    </span>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                  {
                    //TODO: Decide whether to show these buttons
                    /* {message.role === "agent" && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                )} */
                  }
                </div>
              </div>
            ))
          )}
          {loading && (
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
                  <p className="text-sm whitespace-pre-wrap">Generating...</p>
                </div>
              </div>
            </div>
          )}
          {error && (
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
                  <p className="text-sm whitespace-pre-wrap">
                    {errorMessage.content}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type a message as a customer"
            value={userInput}
            onKeyDown={handleEnter}
            onChange={(e) => setUserInput(e.target.value)}
            className="min-h-[44px] max-h-32"
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
