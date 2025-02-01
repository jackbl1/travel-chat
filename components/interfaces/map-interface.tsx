"use client";

import LocationMap from "@/components/LocationMap";

const locations = [
  { id: "1", name: "New York", lat: 40.7128, lng: -74.006 },
  { id: "2", name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { id: "3", name: "London", lat: 51.5074, lng: -0.1278 },
];

export default function MapPage() {
  return (
    <div className="w-full p-4 h-[calc(100vh-theme(spacing.16))]">
      <h1 className="text-2xl font-bold mb-4">Location Map</h1>
      <div className="flex-1 rounded-lg overflow-hidden shadow-lg min-h-0">
        <LocationMap
          locations={locations}
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
        />
      </div>
    </div>
  );
}
