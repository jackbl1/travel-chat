"use client"

import { useState, useCallback, useEffect } from "react"
import {useSelector} from "react-redux"
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api"
import ErrorMessage from "./ErrorMessage"
import MapsInfoMessage from "./MapsInfoMessage"

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

  useEffect(() => {
    if (isLoaded && apiKey) {
      console.log(locations);
      setIsGeocoding(true)
      const geocoder = new window.google.maps.Geocoder()
      const promises = locations.map(
        (location) =>
          new Promise<GeocodedLocation>((resolve, reject) => {
            geocoder.geocode({ address: location.name }, (results, status) => {
              if (status === "OK" && results[0]) {
                const { lat, lng } = results[0].geometry.location.toJSON()
                resolve({ ...location, lat, lng })
              } else {
                reject(`Geocode was not successful for the following reason: ${status}`)
              }
            })
          }),
      )

      Promise.all(promises)
        .then((results) => {
          setGeocodedLocations(results)
          if (map) {
            const bounds = new window.google.maps.LatLngBounds()
            results.forEach((location) => bounds.extend({ lat: location.lat, lng: location.lng }))
            map.fitBounds(bounds)
          }
        })
        .catch((error) => console.error(error))
        .finally(() => setIsGeocoding(false))
    }
  }, [isLoaded, apiKey, locations, map])

  // if (locations.length === 0) {
  //   return <MapsInfoMessage message="Please add a location to your itinerary" />
  // }

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

