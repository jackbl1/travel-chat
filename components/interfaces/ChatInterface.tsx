"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useSupabase } from "@/contexts/SupabaseContext";
import { useDispatch, useSelector } from "react-redux";
import {
  addLocation,
  getActiveSessionId,
  setActiveSessionId,
} from "@/redux/itinerarySlice";
import {
  useAddSession,
  useGetSessions,
  useUpdateSessionWithLocations,
} from "@/hooks/useSessions";
import { useAddMessage, useGetMessages } from "@/hooks/useMessages";
import { MessageInterface } from "@/lib/types";
import {
  useMessageOperations,
  useSessionOperations,
} from "@/hooks/usePostOperation";

const defaultMessageContent = [
  // Natural Wonders
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
  createdAt: new Date().toLocaleTimeString(),
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
  createdAt: new Date().toLocaleTimeString(),
});

export default function ChatInterface() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [defaultMessage] = useState(getRandomDefaultMessage);

  const { user } = useSupabase();
  const { data: sessions } = useGetSessions(user?.id);
  const activeSessionId = useSelector(getActiveSessionId);
  const dispatch = useDispatch();

  const { data: messages, refetch: refetchMessages } = useGetMessages(
    activeSessionId ?? ""
  );
  const addMessageMutation = useAddMessage();
  const addSessionMutation = useAddSession();
  const { mutateAsync: updateSessionLocations } =
    useUpdateSessionWithLocations(); // const { addSession, deleteSession, addLocationsToSession } =

  const onAddSession = async (name: string = "New Session", userId: string) => {
    try {
      const res = await addSessionMutation.mutateAsync({
        name,
        userId,
      });
      //const res = await addSession({ name, userId });
      dispatch(setActiveSessionId(res.session_id));
      return res;
    } catch (e) {
      console.log("Error adding session:", e);
    }
  };

  // Helper function to add a message
  const addMessageHelper = async (
    sessionId: string,
    userId: string,
    role: string,
    content: string
  ) => {
    try {
      await addMessageMutation.mutateAsync({
        sessionId,
        content,
        role,
        userId,
      });
    } catch (e) {
      console.error("Error adding message:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageContent = userInput.trim();
    setUserInput("");

    if (!messageContent) return;

    setLoading(true);
    setError(false);

    try {
      // 1. Create session if not already in active session
      let sessionId = activeSessionId;
      if (!sessionId) {
        const newSession = await onAddSession(
          `Session ${(sessions?.length ?? 0) + 1}`,
          user?.id ?? "user1"
        );
        sessionId = newSession?.session_id;
        if (!sessionId) {
          throw new Error("Failed to create new session");
        }
      }

      // 2. Add user message to database
      await addMessageHelper(sessionId, user?.id ?? "", "user", messageContent);

      // 3. Get AI response
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageContent }),
      });

      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // 4. Update session with locations and add agent response
      await Promise.all([
        await updateSessionLocations({
          sessionId,
          locations: data.locations,
        }),
        addMessageHelper(sessionId, user?.id ?? "", "agent", data.reply),
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setError(true);
    } finally {
      await refetchMessages();
      setLoading(false);
    }
  };

  // Prevent blank submissions and allow for multiline input
  const handleEnter = (e) => {
    if (e.key === "Enter" && userInput) {
      if (!e.shiftKey && userInput) {
        handleSubmit(e);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      <ScrollArea className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
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
                  {new Date().toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">
                  {defaultMessage.content}
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

          {messages?.map((message, index) => (
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
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {message.role === "agent" ? "Travel Chat" : "User"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {message.createdAt}
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
          ))}
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
}
