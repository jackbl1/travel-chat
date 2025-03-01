import { useSelector } from "react-redux";
import React from "react";
import { useGetLocations } from "@/hooks/useLocations";
import { getActiveSessionId } from "@/redux/sessionSlice";
import { LocationInfo } from "./LocationInfo";
import { useState } from "react";

function LocationsList() {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const activeSessionId = useSelector(getActiveSessionId);
  const locations = useGetLocations(activeSessionId);

  return (
    <div className="p-2 overflow-y-auto">
      <div className="space-y-2">
        {locations.data?.map((location, index) => (
          <LocationInfo
            key={location.locationId}
            index={index}
            location={location}
            selected={location.locationId === selectedLocation}
            setSelected={setSelectedLocation}
          />
        ))}
        {(!locations || locations.data?.length === 0) && (
          <div className="text-sm text-muted-foreground italic">
            No locations added yet
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationsList;
