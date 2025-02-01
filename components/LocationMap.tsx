"use client";

import { useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";

interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface LocationMapProps {
  locations: Location[];
  apiKey?: string;
}

const containerStyle = {
  width: "100%",
  height: "100%", // Changed from 400px to 100%
  minHeight: "400px", // Added minHeight to ensure it doesn't get too small
}

const center = {
  lat: 0,
  lng: 0,
};

export default function LocationMap({ locations, apiKey }: LocationMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  });

  if (!apiKey) {
    return (
      <ErrorMessage message="Google Maps API key is missing. Please check your environment variables." />
    );
  }

  const [map, setMap] = useState(null);

  const onLoad = useCallback(
    function callback(map) {
      if (locations.length === 0) return;

      const bounds = new window.google.maps.LatLngBounds(center);
      locations.forEach((location) =>
        bounds.extend({ lat: location.lat, lng: location.lng })
      );
      map.fitBounds(bounds);
      setMap(map);
    },
    [locations]
  );

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  if (loadError) {
    return (
      <ErrorMessage message="Error loading Google Maps. Please check your API key and try again." />
    );
  }

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  if (locations.length === 0) {
    return (
      <ErrorMessage message="No locations provided to display on the map." />
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={10}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {locations.map((location) => (
        <Marker
          key={location.id}
          position={{ lat: location.lat, lng: location.lng }}
          title={location.name}
        />
      ))}
    </GoogleMap>
  );
}
