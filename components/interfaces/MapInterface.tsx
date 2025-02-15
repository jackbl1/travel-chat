"use client";

import { LocationMap } from "@/components/LocationMap";
import { useSelector } from "react-redux";
import { getSelectedLocation } from "@/redux/mapSlice";
import { getActiveSessionId } from "@/redux/itinerarySlice";
import { useGetSessions } from "@/hooks/useSessions";
import { useSupabase } from "@/contexts/SupabaseContext";
import { LocationType } from "@/lib/types";
import { setCurrentView, View } from "@/redux/viewSlice";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Plus, PlaneTakeoff } from "lucide-react";

export default function MapPage() {
  const { user } = useSupabase();
  const dispatch = useDispatch();
  const activeSessionId = useSelector(getActiveSessionId);
  const selectedLocation = useSelector(getSelectedLocation);
  const { data: sessions } = useGetSessions(user?.id);
  const activeSession = sessions?.find(
    (session) => session.sessionId === activeSessionId
  );
  const locations: LocationType[] =
    activeSession?.locations?.map((location) => {
      return {
        name: location,
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
          selectedLocation={selectedLocation}
        />
      </div>
    </div>
  );
}
