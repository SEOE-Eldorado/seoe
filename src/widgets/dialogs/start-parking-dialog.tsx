"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@shared/ui/atoms/dialog"
import { Button } from "@shared/ui/atoms/button"
import { Input } from "@shared/ui/atoms/input"
import { Label } from "@shared/ui/atoms/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/ui/atoms/select"
import { useParking } from "@entities/parking-context"
import { useVehicles } from "@entities/vehicles-context"
import { useAuth } from "@entities/auth-context"
import { useGeolocation } from "@entities/geolocation-context"
import { MapPin, Clock, Car, AlertCircle, Navigation } from "lucide-react"
import { Alert, AlertDescription } from "@shared/ui/atoms/alert"

interface StartParkingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const zones = [
  { id: "zone-a", name: "Zona A - Centro", costPerHour: 15 },
  { id: "zone-b", name: "Zona B - Comercial", costPerHour: 12 },
  { id: "zone-c", name: "Zona C - Residencial", costPerHour: 8 },
]

const quickTimeOptions = [
  { label: "30 min", value: 0.5 },
  { label: "1 hora", value: 1 },
  { label: "1.5 horas", value: 1.5 },
  { label: "2 horas", value: 2 },
  { label: "3 horas", value: 3 },
]

export function StartParkingDialog({ open, onOpenChange }: StartParkingDialogProps) {
  const { startParking } = useParking()
  const { vehicles, getDefaultVehicle } = useVehicles()
  const { user } = useAuth()
  const { location, requestLocation, isLoading: locationLoading } = useGeolocation()
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [selectedZone, setSelectedZone] = useState("")
  const [hours, setHours] = useState("2")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && vehicles.length > 0) {
      const defaultVehicle = getDefaultVehicle()
      if (defaultVehicle) {
        setSelectedVehicle(defaultVehicle.id)
      }
    }
  }, [open, vehicles, getDefaultVehicle])

  const selectedZoneData = zones.find((z) => z.id === selectedZone)
  const totalCost = selectedZoneData ? Number.parseFloat(hours) * selectedZoneData.costPerHour : 0

  const handleStart = async () => {
    setError("")

    if (!selectedVehicle || !selectedZone || !hours) {
      setError("Por favor completa todos los campos")
      return
    }

    const hoursNum = Number.parseFloat(hours)
    if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) {
      setError("Las horas deben estar entre 0.5 y 24")
      return
    }

    if (user && user.balance < totalCost) {
      setError("Saldo insuficiente. Por favor recarga tu cuenta.")
      return
    }

    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const address = "Ubicación detectada automáticamente"
      startParking(selectedVehicle, selectedZoneData!.name, address, hoursNum, selectedZoneData!.costPerHour)
      onOpenChange(false)

      setHours("2")
      setSelectedZone("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar estacionamiento")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Iniciar Estacionamiento</DialogTitle>
          <DialogDescription>Configura los detalles de tu estacionamiento</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Vehicle selection */}
          <div className="space-y-2">
            <Label htmlFor="vehicle" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Vehículo
            </Label>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger id="vehicle">
                <SelectValue placeholder="Selecciona un vehículo" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Zone selection */}
          <div className="space-y-2">
            <Label htmlFor="zone" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Zona
            </Label>
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger id="zone">
                <SelectValue placeholder="Selecciona una zona" />
              </SelectTrigger>
              <SelectContent>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name} - ${zone.costPerHour}/hr
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              Ubicación
            </Label>
            <div className="bg-muted rounded-sm p-3 space-y-2">
              {location ? (
                <div className="text-sm">
                  <div className="font-medium text-foreground">Ubicación detectada automáticamente</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {locationLoading ? "Detectando ubicación..." : "Ubicación no disponible"}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={requestLocation}
                disabled={locationLoading}
                className="w-full bg-transparent"
              >
                <Navigation className="h-3 w-3 mr-2" />
                {locationLoading ? "Detectando..." : "Actualizar ubicación"}
              </Button>
            </div>
          </div>

          {/* Hours */}
          <div className="space-y-2">
            <Label htmlFor="hours" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horas de estacionamiento
            </Label>

            <div className="flex flex-wrap gap-2 mb-2">
              {quickTimeOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={Number.parseFloat(hours) === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHours(option.value.toString())}
                  className="flex-1 min-w-[80px]"
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <Input
              id="hours"
              type="number"
              step="0.5"
              min="0.5"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="O ingresa un tiempo personalizado"
            />
          </div>

          {/* Cost summary */}
          {selectedZoneData && (
            <div className="bg-muted rounded-sm p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tarifa por hora</span>
                <span className="font-medium">${selectedZoneData.costPerHour}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Duración</span>
                <span className="font-medium">{hours} horas</span>
              </div>
              <div className="pt-2 border-t flex items-center justify-between">
                <span className="font-semibold">Total a pagar</span>
                <span className="text-2xl font-bold text-primary">${totalCost.toFixed(2)}</span>
              </div>
              <div className="text-xs text-muted-foreground">Saldo disponible: ${user?.balance.toFixed(2)}</div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleStart} disabled={loading || !selectedVehicle || !selectedZone} className="w-full h-11">
            {loading ? "Iniciando..." : "Iniciar Estacionamiento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
