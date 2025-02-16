import { createClient } from "@supabase/supabase-js";

const requireEnvVar = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is missing`);
  }
  return value;
};

// Supabase client initialization
const supabase = await createClient(
  requireEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnvVar("NEXT_PUBLIC_SUPABASE_KEY")
);

export const getSessionMessages = async (sessionId: string) => {
  const { data, error } = await supabase
    .from("messages")
    .select()
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
};
