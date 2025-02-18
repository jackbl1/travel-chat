"use client";
import React, { useEffect } from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { getCurrentView, setCurrentView } from "@/redux/viewSlice";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { View } from "@/redux/viewSlice";
import {
  LucideIcon,
  MessageCirclePlus,
  Bot,
  Map,
  MapPinned,
  ClipboardList,
} from "lucide-react";
import {
  getActiveSession,
  getActiveSessionId,
  setActiveSession,
} from "@/redux/sessionSlice";
import { useGetSessions } from "@/hooks/useSessions";
import { useSupabase } from "@/contexts/SupabaseContext";

interface NavButton {
  label: string;
  view: View;
  icon: LucideIcon;
  disabled?: boolean;
}

export const NavPanel = () => {
  const dispatch = useDispatch();
  const currentView = useSelector(getCurrentView);
  const activeSessionId = useSelector(getActiveSessionId);
  const activeSession = useSelector(getActiveSession);
  const { user } = useSupabase();
  const { data: sessions } = useGetSessions(user?.id);

  // When active session ID changes, update the active session
  useEffect(() => {
    if (activeSessionId) {
      const session = sessions?.find(
        (session) => session.sessionId === activeSessionId
      );
      if (session) {
        dispatch(setActiveSession(session));
      }
    }
  }, [activeSessionId]);

  const getNavButtons = () => {
    const buttons: NavButton[] = [
      {
        label: "New Chat",
        view: View.NewChat,
        icon: MessageCirclePlus,
      },
      {
        label: "Current Chat",
        view: View.CurrentChat,
        icon: Bot,
      },
      {
        label: "Itinerary",
        view: View.Itinerary,
        icon: Map,
      },
      {
        label: "Map",
        view: View.Map,
        icon: MapPinned,
        disabled:
          activeSession?.locations && activeSession.locations.length === 0,
      },
      {
        label: "Past Trips",
        view: View.PastTrips,
        icon: ClipboardList,
      },
    ];

    return buttons;
  };

  return (
    <div className="min-w-64 max-w-64 border-r bg-muted/10">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Image
            src="/icon.webp"
            alt="Icon"
            className="h-6 w-6 rounded-full"
            width={32}
            height={32}
          />
          <span className="font-semibold">Travel Chat</span>
        </div>
        {/* {activeSession && (
            <span className="text-sm text-gray-500 ml-2">
              • {activeSession.name}
            </span>
          )} */}
      </div>
      <div className="space-y-4 p-4">
        <nav className="space-y-2">
          {getNavButtons().map((button) => (
            <Button
              key={button.label}
              variant="ghost"
              className={cn(
                "w-full justify-start",
                currentView === button.view &&
                  "bg-primary/10 hover:bg-primary/10"
              )}
              onClick={() => dispatch(setCurrentView(button.view))}
            >
              <button.icon className="mr-2 h-4 w-4" />
              {button.label}
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
};
