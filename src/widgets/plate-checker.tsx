"use client"

import { useState } from "react"
import { useParking, type ParkingSession } from "@entities/parking-context"
import { Button } from "@shared/ui/atoms/button"
import { Input } from "@shared/ui/atoms/input"
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/atoms/card"
import { Badge } from "@shared/ui/atoms/badge"
import { Search, Car, Clock, MapPin, AlertTriangle, CheckCircle2, Camera, RefreshCw } from "lucide-react"
import { PlateScannerDialog } from "@widgets/dialogs/plate-scanner-dialog"

interface PlateCheckerProps {
    onResult: (plate: string, session: ParkingSession | null) => void
}

export function PlateChecker({ onResult }: PlateCheckerProps) {
    const { checkPlateStatus } = useParking()
    const [plate, setPlate] = useState("")
    const [loading, setLoading] = useState(false)
    const [scannerOpen, setScannerOpen] = useState(false)

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!plate) return

        setLoading(true)
        try {
            const result = await checkPlateStatus(plate)
            onResult(plate.toUpperCase(), result)
        } catch (error) {
            console.error("Search error:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleScanned = (data: { licensePlate: string }) => {
        setPlate(data.licensePlate)
        // Trigger search automatically after scan
        setLoading(true)
        checkPlateStatus(data.licensePlate)
            .then(result => onResult(data.licensePlate.toUpperCase(), result))
            .finally(() => setLoading(false))
    }

    return (
        <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex flex-col gap-3">
                <div className="flex gap-2 w-full">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="ABC 123"
                            value={plate}
                            onChange={(e) => setPlate(e.target.value.toUpperCase())}
                            className="pl-12 h-16 text-xl font-black tracking-[0.2em] rounded-2xl border-slate-200 bg-slate-50/30 focus:bg-white transition-all shadow-inner"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        className="h-16 w-16 rounded-2xl shrink-0 bg-slate-100 border-none hover:bg-slate-200 transition-colors"
                        onClick={() => setScannerOpen(true)}
                    >
                        <Camera className="h-6 w-6 text-slate-600" />
                    </Button>
                </div>
                <Button
                    type="submit"
                    disabled={loading || !plate}
                    className="h-14 w-full rounded-2xl font-black text-sm tracking-widest bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all uppercase"
                >
                    {loading ? <RefreshCw className="animate-spin size-4 mr-2" /> : "Verificar Estado"}
                </Button>
            </form>

            <PlateScannerDialog
                open={scannerOpen}
                onOpenChange={setScannerOpen}
                onDataScanned={handleScanned}
            />
        </div>
    )
}
