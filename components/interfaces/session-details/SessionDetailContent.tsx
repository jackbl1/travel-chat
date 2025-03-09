"use client";

import { useSelector } from "react-redux";
import { getSessionDetailView, SessionDetailView } from "@/redux/sessionSlice";
import { CustomizeInterface } from "./CustomizeInterface";
import { LocationsList } from "./LocationsList";

export const SessionDetailContent = () => {
  const currentView = useSelector(getSessionDetailView);

  const renderContent = () => {
    switch (currentView) {
      case SessionDetailView.Locations:
        return <LocationsList />;
      case SessionDetailView.Customize:
        return <CustomizeInterface />;
      default:
        return undefined;
    }
  };

  return <div className="flex-1 overflow-auto">{renderContent()}</div>;
};
