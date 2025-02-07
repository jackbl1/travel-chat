"use client";

import React from "react";
import ChatInterface from "./chat-interface";
import MapInterface from "./map-interface";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import Image from "next/image";
import {
  MessageCirclePlus,
  Map,
  MapPinned,
  Bot,
  ClipboardList,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import NewChatInterface from "./new-chat-interface";
import PastTripInterface from "./past-trip-interface";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentView, setCurrentView, View } from "@/redux/viewSlice";
import { getActiveSessionId } from "@/redux/itinerarySlice";
import { useGetSessions } from "@/hooks/useSessions";
import { useSupabase } from "@/contexts/SupabaseContext";

interface NavButton {
  label: string;
  view: View;
  icon: LucideIcon;
  disabled?: boolean;
}

function InterfaceWindow() {
  const dispatch = useDispatch();
  const currentView = useSelector(getCurrentView);
  const activeSessionId = useSelector(getActiveSessionId);
  const { user } = useSupabase();
  const { data: sessions } = useGetSessions(user?.id ?? "");

  const activeSession = sessions?.find(
    (session) => session.sessionId === activeSessionId
  );

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

  const renderContent = () => {
    switch (currentView) {
      case View.NewChat:
        return <NewChatInterface />;
      case View.CurrentChat:
        return <ChatInterface />;
      case View.Itinerary:
        return <div>Itinerary Content</div>;
      case View.Map:
        return <MapInterface />;
      case View.PastTrips:
        return <PastTripInterface />;
      default:
        return <div>Current Chat Content</div>;
    }
  };

  return (
    <div className="flex bg-background">
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
          {activeSession && (
            <span className="text-sm text-gray-500 ml-2">
              • {activeSession.name}
            </span>
          )}
        </div>
        <ScrollArea className="h-[calc(100vh-64px)]">
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
        </ScrollArea>
      </div>
      {renderContent()}
    </div>
  );
}

export default InterfaceWindow;
