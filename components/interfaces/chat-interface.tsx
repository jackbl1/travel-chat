"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useSupabase } from "@/contexts/SupabaseContext";
import { useDispatch } from "react-redux";
import { addLocation } from "@/redux/itinerarySlice";

interface Message {
  role: "agent" | "user";
  content: string;
  timestamp: string;
  error?: string;
}

export default function ChatInterface() {
  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      content: "Hello, I am Trip-Gen-Bot, where can I take ya?",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const { supabase, user } = useSupabase();
  const dispatch = useDispatch();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userInput.trim() === "") {
      return;
    }

    const newMessage: Message = {
      role: "user",
      content: userInput,
      timestamp: new Date().toLocaleTimeString(),
    };

    setLoading(true);
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    // Save the new message to the Supabase sessions database
    if (supabase && user) {
      // TODO: remove user lookup here if the new user context works
      // const {
      //   data: { user },
      // } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("messages")
        .insert([{ user_id: user.id, session_id: 1, message: newMessage }]);

      if (error) {
        console.error("Error saving message:", error);
      }
    }

    // Send user question and history to API
    // TODO: send history along with user input
    // const response = await fetch("/api/chat", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({ question: userInput, history: history }),
    // });

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
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "agent",
            content: "An error occurred while processing your request.",
            timestamp: new Date().toLocaleTimeString(),
            error: data.error,
          },
        ]);
      } else {
        // Add response to conversation
        const agentMessage: Message = {
          role: "agent",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prevMessages) => [...prevMessages, agentMessage]);
        // Add the list of locations to the redux state
        for (const location of data.locations) {
          dispatch(
            addLocation({
              name: location,
            })
          );
        }

        if (supabase && user) {
          // TODO: remove user lookup here if the new user context works
          // const {
          //   data: { user },
          // } = await supabase.auth.getUser();
          const { error } = await supabase
            .from("messages")
            .insert([{ user_id: user.id, session_id: 1, message: newMessage }]);

          if (error) {
            console.error("Error saving message:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "agent",
          content: "An error occurred while processing your request.",
          timestamp: new Date().toLocaleTimeString(),
          error: "Unknown error",
        },
      ]);
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
          {messages.map((message, index) => (
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
                    {message.timestamp}
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
