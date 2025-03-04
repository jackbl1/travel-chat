import { useGetLocations } from "@/hooks/useLocations";
import { SessionInterface } from "@/lib/types";
import React from "react";

export const PastTripCard = ({ session }: { session: SessionInterface }) => {
  const { data: locations } = useGetLocations(session.sessionId);

  return (
    <div className="w-full bg-gray-100 rounded-lg p-4 mt-[-8px] rounded-t-none">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Session Details</h2>
        <div className="text-sm text-gray-500">
          Created: {new Date(session.createdAt).toLocaleDateString()}
        </div>
        <div className="text-sm text-gray-600">
          Locations: {locations?.map((location) => location.name).join(", ")}
        </div>
      </div>
    </div>
  );
};
