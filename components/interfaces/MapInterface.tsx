"use client";

import LocationMap from "@/components/LocationMap";

const locations = [
  { id: "1", name: "Mozzelles, Wnston Salem"},
  { id: "2", name: "Meadowlar Elementary School, Winston Salem"},
  { id: "3", name: "Sheetz, Winston Salem"}
];

export default function MapPage() {
  return (
    <div className="w-full p-4 h-[calc(100vh-theme(spacing.16))]">
      <h1 className="text-2xl font-bold mb-4">Location Map</h1>
      <div className="flex-1 rounded-lg overflow-hidden shadow-lg min-h-0">
        <LocationMap
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
        />
      </div>
    </div>
  );
}
