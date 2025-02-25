import { useSelector } from "react-redux";
import React from "react";
import { useGetLocations } from "@/hooks/useLocations";
import { getActiveSessionId } from "@/redux/sessionSlice";
import { LocationInfo } from "./LocationInfo";

function LocationsList() {
  const activeSessionId = useSelector(getActiveSessionId);
  const locations = useGetLocations(activeSessionId);

  console.log("rendering locations list");
  console.log("locations", locations);

  return (
    <div className="p-4">
      <div className="space-y-2">
        {locations.data?.map((location) => (
          <LocationInfo key={location.locationId} location={location} />
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
