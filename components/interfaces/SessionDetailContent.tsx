"use client";

import { useSelector, useDispatch } from "react-redux";
import {
  getActiveSession,
  getSessionDetailView,
  SessionDetailView,
} from "@/redux/sessionSlice";
import { View, setCurrentView } from "@/redux/viewSlice";
import { setSelectedLocation } from "@/redux/mapSlice";

const bgColors = [
  "bg-blue-100",
  "bg-green-100",
  "bg-yellow-100",
  "bg-red-100",
  "bg-purple-100",
  "bg-orange-100",
];

export const SessionDetailContent = () => {
  const dispatch = useDispatch();
  const currentView = useSelector(getSessionDetailView);
  const session = useSelector(getActiveSession);

  const renderContent = () => {
    switch (currentView) {
      case SessionDetailView.Locations:
        return (
          <div className="p-4">
            <div className="space-y-2">
              {session?.locations?.map((location, index) => {
                return (
                  <div
                    key={index}
                    className={`flex items-center py-2 px-3 rounded-lg border w-fit ${
                      bgColors[index % bgColors.length]
                    } text-card-foreground shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                    onClick={() => {
                      dispatch(setCurrentView(View.Map));
                      dispatch(setSelectedLocation(location));
                    }}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{location}</h4>
                    </div>
                  </div>
                );
              })}
              {(!session?.locations || session.locations.length === 0) && (
                <div className="text-sm text-muted-foreground italic">
                  No locations added yet
                </div>
              )}
            </div>
          </div>
        );
      case SessionDetailView.Activities:
        return (
          <div className="p-4">
            <h3 className="font-semibold mb-2">Activities</h3>
          </div>
        );
      case SessionDetailView.Accommodations:
        return (
          <div className="p-4">
            <h3 className="font-semibold mb-2">Accommodations</h3>
          </div>
        );
      default:
        return null;
    }
  };

  return <div className="flex-1 overflow-auto">{renderContent()}</div>;
};
