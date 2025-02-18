"use client";

import React from "react";
import { Button } from "../ui/button";
import { SessionDetailContent } from "./SessionDetailContent";
import { useDispatch, useSelector } from "react-redux";
import {
  getActiveSession,
  getSessionDetailView,
  SessionDetailView,
  setSessionDetailView,
} from "@/redux/sessionSlice";

export const SessionDetailPanel = () => {
  const currentView = useSelector(getSessionDetailView);
  const session = useSelector(getActiveSession);

  const dispatch = useDispatch();
  return (
    <div className="flex-1 flex flex-col">
      <div className="h-14 border-b px-4 flex items-center">
        <h2 className="font-semibold">{session?.name ?? "Session Details"}</h2>
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
              dispatch(setSessionDetailView(SessionDetailView.Activities));
            }}
            variant="ghost"
            size="sm"
            className={
              currentView === SessionDetailView.Activities
                ? "bg-accent text-accent-foreground rounded-full"
                : "rounded-full"
            }
          >
            Activities
          </Button>
          <Button
            onClick={() => {
              dispatch(setSessionDetailView(SessionDetailView.Accommodations));
            }}
            variant="ghost"
            size="sm"
            className={
              currentView === SessionDetailView.Accommodations
                ? "bg-accent text-accent-foreground rounded-full"
                : "rounded-full"
            }
          >
            Accommodations
          </Button>
        </div>
      </div>
      <SessionDetailContent />
    </div>
  );
};
