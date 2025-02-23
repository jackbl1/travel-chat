"use client";

import { useState, useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import ErrorMessage from "./ErrorMessage";
import MapsInfoMessage from "./MapsInfoMessage";
import { LocationType } from "@/lib/types";

interface GeocodedLocation {
  name: string;
  lat: number;
  lng: number;
}

const containerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "400px",
};

const center = {
  lat: 0,
  lng: 0,
};

export const LocationMap = ({
  apiKey,
  locations,
  selectedLocation,
}: {
  apiKey?: string;
  locations: LocationType[];
  selectedLocation: string | null;
}) => {
  const [isClient, setIsClient] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [geocodedLocations, setGeocodedLocations] = useState<GeocodedLocation[]>([]);
  const [failedLocations, setFailedLocations] = useState<string[]>([]);
  const hasZoomedRef = useRef<string | null>(null);
  const geocodedLocationNames = useRef(new Set<string>());

  // Zoom to selected location or fit bounds to all locations
  useEffect(() => {
    if (geocodedLocations.length > 0 && mapRef.current) {
      if (selectedLocation) {
        const location = geocodedLocations.find(
          (loc) => loc.name === selectedLocation
        );
        if (location && hasZoomedRef.current !== selectedLocation) {
          mapRef.current.panTo({ lat: location.lat, lng: location.lng });
          mapRef.current.setZoom(7);
          hasZoomedRef.current = selectedLocation;
        }
      } else {
        const bounds = new window.google.maps.LatLngBounds();
        geocodedLocations.forEach((location) => {
          bounds.extend(new window.google.maps.LatLng(location.lat, location.lng));
        });
        mapRef.current.fitBounds(bounds);
      }
    }
  }, [selectedLocation, geocodedLocations, isMapLoaded]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
  });

  // geocode locations
  useEffect(() => {
    if (isLoaded && apiKey) {
      setFailedLocations([]); // Reset failed locations on new geocoding attempt
      const curLocations = locations ?? [];

      const geocoder = new window.google.maps.Geocoder();
      const promises = curLocations.map(
        (location) =>
          new Promise<{
            success: boolean;
            location?: GeocodedLocation;
            name?: string;
          }>((resolve) => {
            const existingLocation = geocodedLocations.find(
              (loc) => loc.name === location.name
            );
            if (existingLocation) {
              resolve({
                success: true,
                location: existingLocation,
              });
              return;
            }

            if (failedLocations.includes(location.name)) {
              resolve({
                success: false,
                name: location.name,
              });
              return;
            }

            if ("lat" in location && "lng" in location) {
              resolve({
                success: true,
                location: location as GeocodedLocation,
              });
              return;
            }

            console.log("geocoding ", location.name);
            geocoder.geocode({ address: location.name }, (results, status) => {
              if (status === "OK" && results && results[0]) {
                const { lat, lng } = results[0].geometry.location.toJSON();
                resolve({
                  success: true,
                  location: { ...location, lat, lng },
                });
              } else {
                resolve({ success: false, name: location.name });
              }
            });
          })
      );

      // this is a bit of a mess but stops us from geocoding the same location multiple times
      Promise.all(promises)
        .then((results) => {
          const successfulResults = results.filter(
            (result): result is { success: true; location: GeocodedLocation } =>
              result.success && !!result.location
          );

          const failures = results
            .filter((result) => !result.success)
            .map((result) => result.name!);
          setFailedLocations((prev) => [...prev, ...failures]);

          const newGeocodedLocations = successfulResults
            .map((r) => r.location)
            .filter((location) => !geocodedLocationNames.current.has(location.name));

          newGeocodedLocations.forEach((location) => {
            geocodedLocationNames.current.add(location.name);
          });

          setGeocodedLocations((prev) => [...prev, ...newGeocodedLocations]);
        });
    }
  }, [isLoaded, apiKey, locations]);

  if (!isClient) {
    return <ErrorMessage message="!isClient" />;
  }

  if (!apiKey) {
    return (
      <ErrorMessage message="Google Maps API key is missing. Please check your environment variables." />
    );
  }

  if (loadError) {
    return (
      <ErrorMessage message="Error loading Google Maps. Please check your API key and try again." />
    );
  }

  if (geocodedLocations.length === 0) {
    return <MapsInfoMessage message="Loading ..." />;
  }

  return (
    <div className="relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
        onLoad={(map) => {
          mapRef.current = map;
          setIsMapLoaded(true);
        }}
      >
        {geocodedLocations.map((location, index) => (
          <Marker
            key={`${location.name}-${index}-${location.lat}-${location.lng}`}
            position={{ lat: location.lat, lng: location.lng }}
            title={location.name}
          />
        ))}
      </GoogleMap>

      {failedLocations.length > 0 && (
        <div className="absolute bottom-2 right-2 group">
          <div className="bg-amber-500 rounded-full w-6 h-6 flex items-center justify-center cursor-help">
            <span className="text-white font-bold">!</span>
          </div>
          <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 w-64 p-2 bg-white shadow-lg rounded-lg text-sm">
            <p className="font-semibold text-amber-600 mb-1">
              Failed to locate:
            </p>
            <ul className="text-slate-600">
              {failedLocations.map((name, index) => (
                <li key={index}>{name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
