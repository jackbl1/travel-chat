import { useGetLocationData } from "@/hooks/useLocationData";
import { LocationDataType, LocationInterface } from "@/lib/types";
import { setSelectedLocation } from "@/redux/mapSlice";
import { setCurrentView, View } from "@/redux/viewSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, Map } from "lucide-react";

export const LocationInfo = ({
  location,
  selected,
  setSelected,
  index,
}: {
  location: LocationInterface;
  selected: boolean;
  setSelected: (selectedId: string | null) => void;
  index: number;
}) => {
  const dispatch = useDispatch();
  const locationData = useGetLocationData(location.locationId);

  const activities =
    locationData.data?.filter(
      (item) => item.type === LocationDataType.ACTIVITY
    ) || [];
  const accommodations =
    locationData.data?.filter(
      (item) => item.type === LocationDataType.ACCOMMODATION
    ) || [];

  const colors = [
    "bg-sky-100",
    "bg-emerald-100",
    "bg-amber-100",
    "bg-rose-100",
    "bg-violet-100",
    "bg-orange-100",
  ];

  const bgColor = colors[index % colors.length];

  return (
    <div className={`rounded-lg border overflow-hidden ${bgColor}`}>
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-black/5"
        onClick={() => {
          if (selected) {
            setSelected(null);
          } else {
            setSelected(location.locationId);
          }
        }}
      >
        <div className="flex items-center gap-2">
          {selected ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
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

      <div
        className={`grid transition-all duration-200 ${
          selected ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`px-3 pb-3 transition-opacity duration-200 ${
              selected ? "opacity-100" : "opacity-0"
            }`}
          >
            <ScrollArea className="h-[256px]">
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
        </div>
      </div>
    </div>
  );
};
