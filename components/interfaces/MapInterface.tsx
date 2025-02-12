"use client";

import { LocationMap } from "@/components/LocationMap";
import { useSelector } from "react-redux";
import { getSelectedLocation } from "@/redux/mapSlice";
import { getActiveSessionId } from "@/redux/itinerarySlice";
import { useGetSessions } from "@/hooks/useSessions";
import { useSupabase } from "@/contexts/SupabaseContext";
import { LocationType } from "@/lib/types";

export default function MapPage() {
  const { user } = useSupabase();
  const activeSessionId = useSelector(getActiveSessionId);
  const selectedLocation = useSelector(getSelectedLocation);
  const { data: sessions } = useGetSessions(user?.id ?? "");
  const activeSession = sessions?.find(
    (session) => session.sessionId === activeSessionId
  );
  const locations: LocationType[] =
    activeSession?.locations?.map((location) => {
      return {
        name: location,
      };
    }) ?? [];

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
