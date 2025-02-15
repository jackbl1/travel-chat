"use client";

import React from "react";
import ChatInterface from "./ChatInterface";
import MapInterface from "./MapInterface";
import NewChatInterface from "./NewChatInterface";
import { PastTripInterface } from "./PastTripInterface";
import { useSelector } from "react-redux";
import { getCurrentView, View } from "@/redux/viewSlice";

export const InterfaceWindow = () => {
  const currentView = useSelector(getCurrentView);

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

  return <div className="flex w-full h-full">{renderContent()}</div>;
};
