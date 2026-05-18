"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@shared/ui/atoms/dialog"
import { Button } from "@shared/ui/atoms/button"
import { Input } from "@shared/ui/atoms/input"
import { Label } from "@shared/ui/atoms/label"
import { useVehicles } from "@entities/vehicles-context"
import { Car, Camera } from "lucide-react"
import { PlateScannerDialog } from "./plate-scanner-dialog"

interface AddVehicleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddVehicleDialog({ open, onOpenChange }: AddVehicleDialogProps) {
  const { addVehicle } = useVehicles()
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: "",
    color: "",
    licensePlate: "",
    insuranceExpiry: "",
    technicalReviewExpiry: "",
    driverLicenseExpiry: "",
  })
  const [scannerOpen, setScannerOpen] = useState(false)

  const handleDataScanned = (data: {
    brand: string
    model: string
    year: string
    color: string
    licensePlate: string
  }) => {
    setFormData({ ...formData, ...data })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.brand || !formData.model || !formData.licensePlate) {
      alert("Por favor completa los campos requeridos")
      return
    }

    addVehicle({
      ...formData,
      isDefault: false,
    })

    setFormData({
      brand: "",
      model: "",
      year: "",
      color: "",
      licensePlate: "",
      insuranceExpiry: "",
      technicalReviewExpiry: "",
      driverLicenseExpiry: "",
    })

    onOpenChange(false)
  }

  return (
    <>
      <PlateScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onDataScanned={handleDataScanned} />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Car className="h-5 w-5" />
              Agregar Vehículo
            </DialogTitle>
            <DialogDescription>Registra un nuevo vehículo en tu cuenta</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setScannerOpen(true)}
              className="w-full gap-2 border-dashed border-2 bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 border-primary/50"
            >
              <Camera className="h-4 w-4" />
              Escanear matrícula con cámara
            </Button>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca *</Label>
                <Input
                  id="brand"
                  placeholder="Toyota"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo *</Label>
                <Input
                  id="model"
                  placeholder="Corolla"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Año</Label>
                <Input
                  id="year"
                  placeholder="2020"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="Blanco"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="licensePlate">Placa *</Label>
              <Input
                id="licensePlate"
                placeholder="ABC-123"
                value={formData.licensePlate}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                required
                className="uppercase"
              />
            </div>

            <div className="pt-4 border-t space-y-4">
              <h4 className="font-semibold text-sm">Documentos del Vehículo (Opcional)</h4>

              <div className="space-y-2">
                <Label htmlFor="insuranceExpiry" className="text-sm">
                  Vencimiento del Seguro
                </Label>
                <Input
                  id="insuranceExpiry"
                  type="date"
                  value={formData.insuranceExpiry}
                  onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="technicalReviewExpiry" className="text-sm">
                  Vencimiento de Revisión Técnica
                </Label>
                <Input
                  id="technicalReviewExpiry"
                  type="date"
                  value={formData.technicalReviewExpiry}
                  onChange={(e) => setFormData({ ...formData, technicalReviewExpiry: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverLicenseExpiry" className="text-sm">
                  Vencimiento de Licencia de Conducir
                </Label>
                <Input
                  id="driverLicenseExpiry"
                  type="date"
                  value={formData.driverLicenseExpiry}
                  onChange={(e) => setFormData({ ...formData, driverLicenseExpiry: e.target.value })}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11">
              Registrar Vehículo
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
