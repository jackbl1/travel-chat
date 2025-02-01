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

enum View {
  CurrentChat = "current-chat",
  Itinerary = "itinerary",
  Map = "map",
  PastTrips = "past-trips",
}

function InterfaceWindow() {
  const [currentView, setCurrentView] = useState<View>(View.CurrentChat);

  const renderContent = () => {
    switch (currentView) {
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
    <div className="flex bg-background h-screen">
      <div className="w-64 border-r bg-muted/10">
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
                className="w-full justify-start"
                onClick={() => setCurrentView(View.CurrentChat)}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Current Chat
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setCurrentView(View.Itinerary)}
              >
                <Functions className="mr-2 h-4 w-4" />
                Itinerary
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setCurrentView(View.Map)}
              >
                <Layers className="mr-2 h-4 w-4" />
                Map
              </Button>
            </nav>
            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start"
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
