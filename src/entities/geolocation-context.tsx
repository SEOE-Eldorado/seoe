"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface Location {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: Date
}

export interface ZoneDistance {
  id: string
  name: string
  costPerHour: number
  distance: number
  coordinates: { lat: number; lng: number }
}

interface GeolocationContextType {
  location: Location | null
  error: string | null
  isLoading: boolean
  requestLocation: () => void
  getNearbyZones: () => ZoneDistance[]
  getClosestZone: () => ZoneDistance | null
  hasPermission: boolean
}

const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined)

const parkingZones = [
  {
    id: "zone-a",
    name: "Zona A - Centro",
    costPerHour: 15,
    coordinates: { lat: 19.4326, lng: -99.1332 },
  },
  {
    id: "zone-b",
    name: "Zona B - Comercial",
    costPerHour: 12,
    coordinates: { lat: 19.4284, lng: -99.1276 },
  },
  {
    id: "zone-c",
    name: "Zona C - Residencial",
    costPerHour: 8,
    coordinates: { lat: 19.4205, lng: -99.1413 },
  },
  {
    id: "zone-d",
    name: "Zona D - Parque",
    costPerHour: 10,
    coordinates: { lat: 19.4197, lng: -99.1819 },
  },
  {
    id: "zone-e",
    name: "Zona E - Universitaria",
    costPerHour: 6,
    coordinates: { lat: 19.3327, lng: -99.1873 },
  },
]

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function GeolocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.permissions?.query({ name: "geolocation" }).then((result) => {
        setHasPermission(result.state === "granted")
        if (result.state === "granted") {
          requestLocation()
        }
      })
    }
  }, [])

  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setError("La geolocalización no está soportada en este navegador")
      return
    }

    setIsLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(),
        })
        setHasPermission(true)
        setIsLoading(false)
      },
      (err) => {
        let errorMessage = "No se pudo obtener la ubicación"
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = "Permiso de ubicación denegado"
            setHasPermission(false)
            break
          case err.POSITION_UNAVAILABLE:
            errorMessage = "Ubicación no disponible"
            break
          case err.TIMEOUT:
            errorMessage = "Tiempo de espera agotado"
            break
        }
        setError(errorMessage)
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  const getNearbyZones = (): ZoneDistance[] => {
    if (!location) return []

    return parkingZones
      .map((zone) => ({
        ...zone,
        distance: calculateDistance(location.latitude, location.longitude, zone.coordinates.lat, zone.coordinates.lng),
      }))
      .sort((a, b) => a.distance - b.distance)
  }

  const getClosestZone = (): ZoneDistance | null => {
    const nearbyZones = getNearbyZones()
    return nearbyZones.length > 0 ? nearbyZones[0] : null
  }

  return (
    <GeolocationContext.Provider
      value={{ location, error, isLoading, requestLocation, getNearbyZones, getClosestZone, hasPermission }}
    >
      {children}
    </GeolocationContext.Provider>
  )
}

export function useGeolocation() {
  const context = useContext(GeolocationContext)
  if (context === undefined) {
    throw new Error("useGeolocation must be used within a GeolocationProvider")
  }
  return context
}
