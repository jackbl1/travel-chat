"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import ErrorMessage from "./ErrorMessage";
import MapsInfoMessage from "./MapsInfoMessage";
import { LocationType } from "@/lib/types";

interface GeocodedLocation extends Location {
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
  const mapRef = useRef<google.maps.Map | null>(null);
  const [geocodedLocations, setGeocodedLocations] = useState<
    GeocodedLocation[]
  >([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [failedLocations, setFailedLocations] = useState<string[]>([]);

  useEffect(() => {
    if (selectedLocation && geocodedLocations.length > 0) {
      const location = geocodedLocations.find(
        (loc) => loc.hostname === selectedLocation
      );
      if (location && mapRef.current) {
        mapRef.current.panTo({ lat: location.lat, lng: location.lng });
        mapRef.current.setZoom(15);
      }
    }
  }, [selectedLocation, geocodedLocations]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
  });

  const [map, setMap] = useState(null);

  const onLoad = useCallback(
    function callback(map) {
      if (geocodedLocations.length === 0) return;

      const bounds = new window.google.maps.LatLngBounds(center);
      geocodedLocations.forEach((location) =>
        bounds.extend({ lat: location.lat, lng: location.lng })
      );
      map.fitBounds(bounds);
      setMap(map);
    },
    [geocodedLocations]
  );

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  // New separate useEffect for bounds
  useEffect(() => {
    if (map && geocodedLocations.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      geocodedLocations.forEach((location) => {
        bounds.extend({ lat: location.lat, lng: location.lng });
      });
      map.fitBounds(bounds);
    }
  }, [map, geocodedLocations]);

  useEffect(() => {
    if (isLoaded && apiKey) {
      setFailedLocations([]); // Reset failed locations on new geocoding attempt
      // Skip geocoding if all locations already have coordinates
      const curLocations = locations ?? [];
      // if (curLocations.every((loc) => "lat" in loc && "lng" in loc)) {
      //   setGeocodedLocations(curLocations as GeocodedLocation[]);
      //   return;
      // }

      setIsGeocoding(true);
      const geocoder = new window.google.maps.Geocoder();
      const promises = curLocations.map(
        (location) =>
          new Promise<{
            success: boolean;
            location?: GeocodedLocation;
            name?: string;
          }>((resolve) => {
            // If location already has coordinates, use them
            if ("lat" in location && "lng" in location) {
              resolve({
                success: true,
                location: location as GeocodedLocation,
              });
              return;
            }

            geocoder.geocode({ address: location.name }, (results, status) => {
              if (status === "OK" && results[0]) {
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

      Promise.all(promises)
        .then((results) => {
          const successfulResults = results.filter(
            (result): result is { success: true; location: GeocodedLocation } =>
              result.success && !!result.location
          );

          const failures = results
            .filter((result) => !result.success)
            .map((result) => result.name!);
          console.log(failures);
          setFailedLocations(failures);
          setGeocodedLocations(successfulResults.map((r) => r.location));
        })
        .finally(() => setIsGeocoding(false));
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
        onLoad={onLoad}
        onUnmount={onUnmount}
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
