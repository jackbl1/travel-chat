"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "../utils/supabase/client";

type SupabaseContextType = {
  supabase: SupabaseClient | null;
  user: User | null;
};

const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  user: null,
});

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(
    null
  );
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const setClient = async () => {
      const client = await createClient();
      setSupabaseClient(client);
    };
    setClient();
  }, []);

  useEffect(() => {
    if (supabaseClient) {
      const setUserInfo = async () => {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();
        setUser(user);
      };
      setUserInfo();

      // TODO: figure out why this auth listener doesn't properly sign out
      const { data: authListener } = supabaseClient.auth.onAuthStateChange(
        (event, session) => {
          if (event === "SIGNED_OUT") {
            setUser(null);
          } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            setUser(session?.user ?? null);
          }
        }
      );

      return () => {
        authListener?.subscription.unsubscribe();
      };
    }
  }, [supabaseClient]);

  return (
    <SupabaseContext.Provider value={{ supabase: supabaseClient, user: user }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => useContext(SupabaseContext);
