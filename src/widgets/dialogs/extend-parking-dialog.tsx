"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@shared/ui/atoms/dialog"
import { Button } from "@shared/ui/atoms/button"
import { Label } from "@shared/ui/atoms/label"
import { useParking, type ParkingSession } from "@entities/parking-context"
import { useAuth } from "@entities/auth-context"
import { useSettings } from "@entities/settings-context"
import { Clock, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@shared/ui/atoms/alert"

interface ExtendParkingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: ParkingSession
}

export function ExtendParkingDialog({ open, onOpenChange, session }: ExtendParkingDialogProps) {
  const { extendParking } = useParking()
  const { calculateCost, isOperatingTime } = useSettings()
  const { user } = useAuth()
  const [selectedHours, setSelectedHours] = useState(1)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const hourOptions = [0.5, 1, 2, 3, 4]

  // Calculate new end time
  const newEndTime = new Date(session.endTime.getTime() + (selectedHours * 60 * 60 * 1000))

  // Calculate how many hours are already in the session to know the starting tier
  const currentDuration = (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60 * 60)
  const totalCost = calculateCost(selectedHours, currentDuration)

  const handleExtend = async () => {
    setError("")

    // Check if ending within hours
    if (!isOperatingTime(newEndTime)) {
      setError("El nuevo horario de finalización está fuera del horario operativo.")
      return
    }

    if (user && user.balance < totalCost) {
      setError("Saldo insuficiente. Por favor recarga tu cuenta.")
      return
    }

    setLoading(true)

    try {
      await extendParking(session.id, selectedHours, totalCost)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al extender estacionamiento")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Extender Estacionamiento
          </DialogTitle>
          <DialogDescription>Agrega más tiempo a tu sesión actual</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="mb-3 block">Horas adicionales</Label>
            <div className="grid grid-cols-3 gap-3">
              {hourOptions.map((hrs) => (
                <Button
                  key={hrs}
                  variant={selectedHours === hrs ? "default" : "outline"}
                  onClick={() => setSelectedHours(hrs)}
                  className="h-14 text-lg font-semibold"
                >
                  {hrs}h
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-muted rounded-sm p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tarifa aplicada</span>
              <span className="font-medium text-[10px] uppercase">Tramo progresivo</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tiempo adicional</span>
              <span className="font-medium">{selectedHours} horas</span>
            </div>
            <div className="pt-2 border-t flex items-center justify-between">
              <span className="font-semibold">Total a pagar</span>
              <span className="text-2xl font-bold text-primary">${totalCost.toFixed(2)}</span>
            </div>
            <div className="text-xs text-muted-foreground">Saldo disponible: ${user?.balance.toFixed(2)}</div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleExtend} disabled={loading} className="w-full h-11">
            {loading ? "Extendiendo..." : `Extender por ${selectedHours}h`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
