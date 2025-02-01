"use client"

import { useState, useCallback, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api"
import ErrorMessage from "./ErrorMessage"
import MapsInfoMessage from "./MapsInfoMessage"
import { setLocations } from "../redux/itinerarySlice"

interface GeocodedLocation extends Location {
  lat: number
  lng: number
}

const containerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "400px",
}

const center = {
  lat: 0,
  lng: 0,
}

export default function LocationMap({ apiKey }: { apiKey?: string }) {
  const dispatch = useDispatch()
  const [isClient, setIsClient] = useState(false)
  const [geocodedLocations, setGeocodedLocations] = useState<GeocodedLocation[]>([])
  const [isGeocoding, setIsGeocoding] = useState(false)
  const locations = useSelector((state: rootState) => state.itinerary.locations)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
  })

  const [map, setMap] = useState(null)

  const onLoad = useCallback(
    function callback(map) {
      if (geocodedLocations.length === 0) return

      const bounds = new window.google.maps.LatLngBounds(center)
      geocodedLocations.forEach((location) => bounds.extend({ lat: location.lat, lng: location.lng }))
      map.fitBounds(bounds)
      setMap(map)
    },
    [geocodedLocations],
  )

  const onUnmount = useCallback(function callback(map) {
    setMap(null)
  }, [])

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
      // Skip geocoding if all locations already have coordinates
      if (locations.every(loc => 'lat' in loc && 'lng' in loc)) {
        setGeocodedLocations(locations as GeocodedLocation[]);
        return;
      }

      setIsGeocoding(true);
      const geocoder = new window.google.maps.Geocoder();
      const promises = locations.map(
        (location) =>
          new Promise<GeocodedLocation>((resolve, reject) => {
            // If location already has coordinates, use them
            if ('lat' in location && 'lng' in location) {
              resolve(location as GeocodedLocation);
              return;
            }

            geocoder.geocode({ address: location.name }, (results, status) => {
              if (status === "OK" && results[0]) {
                const { lat, lng } = results[0].geometry.location.toJSON();
                resolve({ ...location, lat, lng });
              } else {
                reject(`Geocode was not successful for the following reason: ${status}`);
              }
            });
          })
      );

      Promise.all(promises)
        .then((results) => {
          setGeocodedLocations(results);
          // Store the geocoded results in Redux
          dispatch(setLocations(results));
        })
        .catch((error) => console.error(error))
        .finally(() => setIsGeocoding(false));
    }
  }, [isLoaded, apiKey, locations, dispatch]);

  if (!isClient) {
    return <ErrorMessage message="!isClient" />
  }

  if (!apiKey) {
    return <ErrorMessage message="Google Maps API key is missing. Please check your environment variables." />
  }

  if (loadError) {
    return <ErrorMessage message="Error loading Google Maps. Please check your API key and try again." />
  }

  if (geocodedLocations.length === 0) {
    return <MapsInfoMessage message="Loading ..." />
  }

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10} onLoad={onLoad} onUnmount={onUnmount}>
      {geocodedLocations.map((location) => (
        <Marker 
          key={`${location.id}-${location.lat}-${location.lng}`} 
          position={{ lat: location.lat, lng: location.lng }} 
          title={location.name} 
        />
      ))}
    </GoogleMap>
  )
}

