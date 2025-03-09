"use client";

import React from "react";
import { Button } from "../../ui/button";
import { SessionDetailContent } from "./SessionDetailContent";
import { useDispatch, useSelector } from "react-redux";
import {
  getActiveSessionId,
  getActiveSessionName,
  getSessionDetailView,
  SessionDetailView,
  setSessionDetailView,
} from "@/redux/sessionSlice";
import { useState, useRef, useEffect } from "react";
import { Input } from "../../ui/input";
import { useUpdateSession } from "@/hooks/useSessions";
import { cn } from "@/lib/utils";

export const SessionDetailPanel = () => {
  const currentView = useSelector(getSessionDetailView);
  const activeSessionName = useSelector(getActiveSessionName);
  const activeSessionId = useSelector(getActiveSessionId);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(activeSessionName ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const { mutateAsync: updateSession } = useUpdateSession();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = async () => {
    if (!activeSessionId) {
      setIsEditing(false);
      return;
    }
    setIsEditing(false);
    if (editedName.trim() !== "" && editedName !== activeSessionName) {
      await updateSession({ sessionId: activeSessionId, name: editedName });
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-scroll">
      <div className="h-14 border-b px-4 flex items-center">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleBlur();
              }
            }}
            className="font-semibold h-8"
          />
        ) : (
          <h2
            className={cn(
              "font-semibold cursor-pointer hover:text-muted-foreground",
              !activeSessionId && "cursor-text pointer-events-none"
            )}
            onClick={() => {
              setIsEditing(true);
              setEditedName(activeSessionName ?? "");
            }}
          >
            {activeSessionName ?? "Session Details"}
          </h2>
        )}
      </div>
      <div className="p-4">
        <div className="flex gap-4 border-b pb-4">
          <Button
            onClick={() => {
              dispatch(setSessionDetailView(SessionDetailView.Locations));
            }}
            variant="ghost"
            size="sm"
            className={
              currentView === SessionDetailView.Locations
                ? "bg-accent text-accent-foreground rounded-full"
                : "rounded-full"
            }
          >
            Locations
          </Button>
          <Button
            onClick={() => {
              dispatch(setSessionDetailView(SessionDetailView.Customize));
            }}
            variant="ghost"
            size="sm"
            className={
              currentView === SessionDetailView.Customize
                ? "bg-accent text-accent-foreground rounded-full"
                : "rounded-full"
            }
          >
            Customize My Trip
          </Button>
        </div>
      </div>
      <SessionDetailContent />
    </div>
  );
};
