import { useGetLocationData } from "@/hooks/useLocationData";
import { LocationDataType, LocationInterface } from "@/lib/types";
import { setSelectedLocation } from "@/redux/mapSlice";
import { setCurrentView, View } from "@/redux/viewSlice";
import { bgColors } from "@/lib/constants";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, Map } from "lucide-react";

const getColorIndex = (locationId: string): number => {
  // Use a simple hash function to generate a consistent number from the locationId
  return locationId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
};

export const LocationInfo = ({ location }: { location: LocationInterface }) => {
  const dispatch = useDispatch();
  const [isExpanded, setIsExpanded] = useState(false);
  const locationData = useGetLocationData(location.locationId);

  const activities =
    locationData.data?.filter(
      (item) => item.type === LocationDataType.ACTIVITY
    ) || [];
  const accommodations =
    locationData.data?.filter(
      (item) => item.type === LocationDataType.ACCOMMODATION
    ) || [];

  const colorIndex = getColorIndex(location.locationId);

  return (
    <div
      className={`rounded-lg border ${
        bgColors[colorIndex % bgColors.length]
      } overflow-hidden`}
    >
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-black/5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <h4 className="font-medium">{location.name}</h4>
        </div>
        <button
          className="p-1 hover:bg-black/10 rounded-md transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            dispatch(setCurrentView(View.Map));
            dispatch(setSelectedLocation(location));
          }}
        >
          <Map size={16} />
        </button>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3">
          <ScrollArea className="h-[200px]">
            {activities.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium mb-2">Activities</h5>
                <div className="space-y-2">
                  {activities.map((activity) => (
                    <a
                      key={activity.locationDataId}
                      href={activity.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 bg-white/50 rounded-md hover:bg-white/80 transition-colors"
                    >
                      {activity.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {accommodations.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Accommodations</h5>
                <div className="space-y-2">
                  {accommodations.map((accommodation) => (
                    <a
                      key={accommodation.locationDataId}
                      href={accommodation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 bg-white/50 rounded-md hover:bg-white/80 transition-colors"
                    >
                      {accommodation.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {activities.length === 0 && accommodations.length === 0 && (
              <div className="text-sm text-muted-foreground italic">
                No activities or accommodations found
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
