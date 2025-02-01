"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";

interface SessionContextProps {
  activeSessionId: string | null;
  setActiveSessionId: (sessionId: string) => void;
  createNewSession: () => void;
}

const SessionContext = createContext<SessionContextProps | undefined>(
  undefined
);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const createNewSession = () => {
    const newSessionId = `session-${Date.now()}`;
    setActiveSessionId(newSessionId);
  };

  return (
    <SessionContext.Provider
      value={{ activeSessionId, setActiveSessionId, createNewSession }}
    >
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
