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
    const setUserInfo = async () => {
      if (supabaseClient) {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();
        setUser(user);
      }
    };
    setUserInfo();
  }, [supabaseClient]);

  return (
    <SupabaseContext.Provider value={{ supabase: supabaseClient, user: user }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => useContext(SupabaseContext);
