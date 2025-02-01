"use client";

import React, { useState } from "react";
import ChatInterface from "./chat-interface";
import MapInterface from "./map-interface";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import Image from "next/image";
import {
  LayoutGrid,
  SettingsIcon as Functions,
  Layers,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSessionManager } from "@/contexts/SessionContext";
import NewChatInterface from "./new-chat-interface";

enum View {
  NewChat = "new-chat",
  CurrentChat = "current-chat",
  Itinerary = "itinerary",
  Map = "map",
  PastTrips = "past-trips",
}

function InterfaceWindow() {
  const [currentView, setCurrentView] = useState<View>(View.NewChat);
  const { createNewSession } = useSessionManager();

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
        return <div>Past Trips Content</div>;
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
            <span className="font-semibold">Trip-Gen-Bot-ZX3000</span>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-64px)]">
          <div className="space-y-4 p-4">
            <nav className="space-y-2">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  currentView === View.NewChat &&
                    "bg-primary/10 hover:bg-primary/10"
                )}
                onClick={() => {
                  createNewSession();
                  setCurrentView(View.NewChat);
                }}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                New Chat
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  currentView === View.CurrentChat &&
                    "bg-primary/10 hover:bg-primary/10"
                )}
                onClick={() => setCurrentView(View.CurrentChat)}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Current Chat
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  currentView === View.Itinerary &&
                    "bg-primary/10 hover:bg-primary/10"
                )}
                onClick={() => setCurrentView(View.Itinerary)}
              >
                <Functions className="mr-2 h-4 w-4" />
                Itinerary
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  currentView === View.Map &&
                    "bg-primary/10 hover:bg-primary/10"
                )}
                onClick={() => setCurrentView(View.Map)}
              >
                <Layers className="mr-2 h-4 w-4" />
                Map
              </Button>
            </nav>
            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  currentView === View.PastTrips &&
                    "bg-primary/10 hover:bg-primary/10"
                )}
                onClick={() => setCurrentView(View.PastTrips)}
              >
                <BarChart2 className="mr-2 h-4 w-4" />
                Past Trips
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
      {renderContent()}
    </div>
  );
}

export default InterfaceWindow;
