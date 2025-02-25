"use client";

import { useSelector, useDispatch } from "react-redux";
import {
  getActiveSessionId,
  getSessionDetailView,
  SessionDetailView,
} from "@/redux/sessionSlice";
import { View, setCurrentView } from "@/redux/viewSlice";
import { setSelectedLocation } from "@/redux/mapSlice";
import { useGetLocations } from "@/hooks/useLocations";
import { useGetLocationData } from "@/hooks/useLocationData";

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
  //const activeSessionLocations = useSelector(getActiveSessionLocations);
  const activeSessionId = useSelector(getActiveSessionId);
  const locations = useGetLocations(activeSessionId);
  const locationData = useGetLocationData(activeSessionId);

  const renderContent = () => {
    switch (currentView) {
      case SessionDetailView.Locations:
        return (
          <div className="p-4">
            <div className="space-y-2">
              {locations.data?.map((location, index) => {
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
                      <h4 className="font-medium">{location.name}</h4>
                    </div>
                  </div>
                );
              })}
              {(!locations || locations.data?.length === 0) && (
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
            <div className="space-y-2">
              {locationData.data
                ?.filter((item) => item.type === "activity")
                .map((activity, index) => (
                  <div
                    key={index}
                    className={`flex items-center py-2 px-3 rounded-lg border w-full ${
                      bgColors[index % bgColors.length]
                    } text-card-foreground shadow-sm`}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{activity.name}</h4>
                      <a
                        href={activity.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Learn more
                      </a>
                    </div>
                  </div>
                ))}
              {(!locationData.data ||
                locationData.data.filter((item) => item.type === "activity")
                  .length === 0) && (
                <div className="text-sm text-muted-foreground italic">
                  No activities added yet
                </div>
              )}
            </div>
          </div>
        );
      case SessionDetailView.Accommodations:
        return (
          <div className="p-4">
            <h3 className="font-semibold mb-2">Accommodations</h3>
            <div className="space-y-2">
              {locationData.data
                ?.filter((item) => item.type === "accommodation")
                .map((accommodation, index) => (
                  <div
                    key={index}
                    className={`flex items-center py-2 px-3 rounded-lg border w-full ${
                      bgColors[index % bgColors.length]
                    } text-card-foreground shadow-sm`}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{accommodation.name}</h4>
                      <a
                        href={accommodation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Learn more
                      </a>
                    </div>
                  </div>
                ))}
              {(!locationData.data ||
                locationData.data.filter(
                  (item) => item.type === "accommodation"
                ).length === 0) && (
                <div className="text-sm text-muted-foreground italic">
                  No accommodations added yet
                </div>
              )}
            </div>
          </div>
        );
      default:
        return undefined;
    }
  };

  return <div className="flex-1 overflow-auto">{renderContent()}</div>;
};
