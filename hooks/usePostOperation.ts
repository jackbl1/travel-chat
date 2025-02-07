import { createClient } from "@supabase/supabase-js";
import { MessageInterface } from "../lib/types";
import { SessionInterface } from "../lib/types";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export const useMessageOperations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addMessage = async (
    message: Omit<MessageInterface, "messageId" | "createdAt">
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const newMessage = {
        message_id: uuidv4(),
        session_id: message.sessionId,
        user_id: message.userId,
        role: message.role,
        content: message.content,
        created_at: new Date().toISOString(),
      };

      const { error: supabaseError } = await supabase
        .from("messages")
        .insert([newMessage]);

      if (supabaseError) throw supabaseError;

      return newMessage;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    const { error: supabaseError } = await supabase
      .from("messages")
      .delete()
      .eq("message_id", messageId);

    if (supabaseError) throw supabaseError;

    return { success: true };
  };

  return {
    addMessage,
    deleteMessage,
    isLoading,
    error,
  };
};

export const useSessionOperations = () => {
  const addSession = async (
    session: Omit<SessionInterface, "sessionId" | "createdAt" | "updatedAt">
  ) => {
    const newSession = {
      name: session.name,
      user_id: session.userId,
      session_id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      locations: session.locations,
    };

    const { error: supabaseError } = await supabase
      .from("sessions")
      .insert([newSession]);

    if (supabaseError) throw supabaseError;

    return newSession;
  };

  const addLocationsToSession = async (
    sessionId: string,
    locations: string[]
  ) => {
    const { error: supabaseError } = await supabase
      .from("sessions")
      .update({
        locations,
      })
      .eq("session_id", sessionId);

    if (supabaseError) throw supabaseError;

    return { success: true };
  };

  const deleteSession = async (sessionId: string) => {
    const { error: supabaseError } = await supabase
      .from("sessions")
      .delete()
      .eq("session_id", sessionId);

    if (supabaseError) throw supabaseError;

    return { success: true };
  };

  return { addSession, addLocationsToSession, deleteSession };
};
