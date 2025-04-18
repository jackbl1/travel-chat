"use client";

import { LocationMap } from "@/components/LocationMap";
import { useSelector } from "react-redux";
import { getSelectedLocation } from "@/redux/mapSlice";
import { LocationInterface, LocationType } from "@/lib/types";
import { setCurrentView, View } from "@/redux/viewSlice";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Plus, PlaneTakeoff } from "lucide-react";
import { getActiveSessionId } from "@/redux/sessionSlice";
import { useGetLocations } from "@/hooks/useLocations";

const parseLocation = (location: LocationInterface) => {
  return location.name + ", " + location.region + ", " + location.country;
};

export const MapInterface = () => {
  const dispatch = useDispatch();
  const selectedLocation = useSelector(getSelectedLocation);
  const activeSessionId = useSelector(getActiveSessionId);
  const { data: locationData } = useGetLocations(activeSessionId);

  const locations: LocationType[] =
    locationData?.map((location) => {
      return {
        name: parseLocation(location),
      };
    }) ?? [];

  if (!locations || locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full text-center px-4">
        <PlaneTakeoff className="h-16 w-16 text-gray-700 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          No destinations yet
        </h2>
        <p className="text-gray-500 mb-8 max-w-md">
          Start planning your first adventure! Chat with TravelChat to begin
          exploring destinations and crafting your perfect itinerary.
        </p>
        <Button
          onClick={() => dispatch(setCurrentView(View.NewChat))}
          className="flex items-center gap-2 bg-gray-700"
        >
          <Plus className="h-4 w-4" />
          Plan a New Adventure
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full p-4 h-[calc(100vh-theme(spacing.16))]">
      <h1 className="text-2xl font-bold mb-4">Location Map</h1>
      <div className="flex-1 rounded-lg overflow-hidden shadow-lg min-h-0">
        <LocationMap
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
          locations={locations}
          selectedLocation={
            !!selectedLocation ? parseLocation(selectedLocation) : null
          }
        />
      </div>
    </div>
  );
};
