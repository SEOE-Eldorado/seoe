"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@shared/ui/atoms/dialog"
import { Button } from "@shared/ui/atoms/button"
import { Input } from "@shared/ui/atoms/input"
import { Label } from "@shared/ui/atoms/label"
import { useVehicles } from "@entities/vehicles-context"
import { Car } from "lucide-react"

interface EditVehicleDialogProps {
  vehicleId: string
  onClose: () => void
}

export function EditVehicleDialog({ vehicleId, onClose }: EditVehicleDialogProps) {
  const { vehicles, updateVehicle } = useVehicles()
  const vehicle = vehicles.find((v) => v.id === vehicleId)

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

  useEffect(() => {
    if (vehicle) {
      setFormData({
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year || "",
        color: vehicle.color || "",
        licensePlate: vehicle.licensePlate,
        insuranceExpiry: vehicle.insuranceExpiry || "",
        technicalReviewExpiry: vehicle.technicalReviewExpiry || "",
        driverLicenseExpiry: vehicle.driverLicenseExpiry || "",
      })
    }
  }, [vehicle])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.brand || !formData.model || !formData.licensePlate) {
      alert("Por favor completa los campos requeridos")
      return
    }

    updateVehicle(vehicleId, formData)
    onClose()
  }

  if (!vehicle) return null

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Car className="h-5 w-5" />
            Editar Vehículo
          </DialogTitle>
          <DialogDescription>Actualiza la información de tu vehículo</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
            <h4 className="font-semibold text-sm">Documentos del Vehículo</h4>

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

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
