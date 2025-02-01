"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";

interface SessionContextProps {
  sessionId: string | null;
  createNewSession: () => void;
}

const SessionContext = createContext<SessionContextProps | undefined>(
  undefined
);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const createNewSession = () => {
    const newSessionId = `session-${Date.now()}`;
    setSessionId(newSessionId);
  };

  return (
    <SessionContext.Provider value={{ sessionId, createNewSession }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionManager = (): SessionContextProps => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
