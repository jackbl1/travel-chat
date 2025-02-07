"use client";

import { useState } from "react";
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
import { useGetSessions } from "@/hooks/useSessions";
import { useGetMessages } from "@/hooks/useMessages";
import { MessageInterface } from "@/lib/types";
import { useAddMessage, useAddSession } from "@/hooks/usePostOperation";

const errorMessage: MessageInterface = {
  messageId: "error",
  sessionId: "session1",
  userId: "user1",
  role: "agent",
  content: "An error occurred while processing your request.",
  createdAt: new Date().toLocaleTimeString(),
};

const defaultMessage: MessageInterface = {
  messageId: "error",
  sessionId: "session1",
  userId: "user1",
  role: "agent",
  content: "Hello, I am Trip-Gen-Bot, where can I take ya?",
  createdAt: new Date().toLocaleTimeString(),
};

export default function ChatInterface() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [userInput, setUserInput] = useState("");

  const { user } = useSupabase();
  const { data: sessions } = useGetSessions(user?.id ?? "");
  const activeSessionId = useSelector(getActiveSessionId);
  const dispatch = useDispatch();

  const {
    addMessage,
    isLoading: isAddMessageLoading,
    error: isAddMessageError,
  } = useAddMessage();
  const messages = useGetMessages(activeSessionId ?? "");
  const { addSession } = useAddSession();
  //const userSessions = useGetSessions(user?.id ?? "");

  const displayMessages = error
    ? [
        defaultMessage,
        ...(Array.isArray(messages.data) ? messages.data : []),
        errorMessage,
      ]
    : [defaultMessage, ...(Array.isArray(messages.data) ? messages.data : [])];

  const onAddSession = async (name: string = "New Session", userId: string) => {
    try {
      // const res = await createSessionMutation.mutateAsync({
      //   name,
      //   userId,
      // });
      const res = await addSession({ name, userId });
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
    content: string,
    locations: string[]
  ) => {
    try {
      await addMessage({
        sessionId,
        content,
        role,
        userId,
      });
      // Handle additional logic for locations if needed
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

    if (userInput.trim() === "") {
      return;
    }

    setLoading(true);
    setError(false);

    if (!activeSessionId) {
      const newSession = await onAddSession(
        `Session ${sessions?.length ?? 0 + 1}`,
        user?.id ?? "user1"
      );
      await addMessageHelper(
        newSession?.session_id ?? "",
        user?.id ?? "",
        "user",
        userInput,
        []
      );
    } else {
      await addMessageHelper(
        activeSessionId ?? "",
        user?.id ?? "",
        "user",
        userInput,
        []
      );
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userInput }),
      });

      setUserInput("");
      const data = await res.json();

      if (data.error) {
        console.error("Error:", data.error);
        setError(true);
      } else {
        // Add the list of locations to the redux state
        for (const location of data.locations) {
          dispatch(
            addLocation({
              name: location,
            })
          );
        }

        // Add agent message to the database
        await addMessageHelper(
          activeSessionId ?? "",
          user?.id ?? "",
          "agent",
          data.reply,
          data.locations
        );
      }
    } catch (fetchError) {
      console.error("Error sending message to API:", fetchError);
      setError(true);
    } finally {
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
          {displayMessages.map((message, index) => (
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
                    {message.role === "agent" ? "Trip-Gen-Bot-ZX3000" : "User"}
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
                  <span className="text-sm font-medium">
                    Trip-Gen-Bot-ZX3000
                  </span>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">Generating...</p>
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
