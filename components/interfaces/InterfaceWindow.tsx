"use client";

import React, { useEffect } from "react";
import { NewChatInterface } from "./NewChatInterface";
import { ChatInterface } from "./ChatInterface";
import { MapInterface } from "./MapInterface";
import { PastTripInterface } from "./PastTripInterface";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentView, setCurrentView, View } from "@/redux/viewSlice";
import { ItineraryInterface } from "./ItineraryInterface";
import { useSupabase } from "@/contexts/SupabaseContext";
import { getPendingQuery } from "@/lib/pendingQuery";

export const InterfaceWindow = () => {
  const dispatch = useDispatch();
  const currentView = useSelector(getCurrentView);
  const { user } = useSupabase();

  // Check for pending query on auth state change
  useEffect(() => {
    if (user?.id) {
      const pendingQuery = getPendingQuery();
      if (pendingQuery) {
        // Small delay to ensure UI is ready
        setTimeout(() => {
          dispatch(setCurrentView(View.CurrentChat));
        }, 100);
      }
    }
  }, [dispatch, user?.id]);

  const renderContent = () => {
    switch (currentView) {
      case View.NewChat:
        return <NewChatInterface />;
      case View.CurrentChat:
        return <ChatInterface />;
      case View.Itinerary:
        return <ItineraryInterface />;
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
