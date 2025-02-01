"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "./store";
import type React from "react"; // Added import for React

export function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore>(null);
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore();
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
