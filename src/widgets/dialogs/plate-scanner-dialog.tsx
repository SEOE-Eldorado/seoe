"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@shared/ui/atoms/dialog"
import { Button } from "@shared/ui/atoms/button"
import { Camera, X, Check, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@shared/ui/atoms/alert"

interface PlateScannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDataScanned: (data: {
    brand: string
    model: string
    year: string
    color: string
    licensePlate: string
  }) => void
}

export function PlateScannerDialog({ open, onOpenChange, onDataScanned }: PlateScannerDialogProps) {
  const [cameraActive, setCameraActive] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (open) {
      startCamera()
    } else {
      handleClose()
    }

    return () => {
      stopCamera()
    }
  }, [open])

  const startCamera = async () => {
    try {
      setError(null)
      setCapturedImage(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraActive(true)
      }
    } catch (err) {
      console.error("[v0] Error accessing camera:", err)
      setError("No se pudo acceder a la cámara. Por favor verifica los permisos.")
      setCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("[v0] Video or canvas ref is null")
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      setError("La cámara aún no está lista. Intenta de nuevo.")
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      console.error("[v0] Could not get canvas context")
      return
    }

    ctx.drawImage(video, 0, 0)
    const imageData = canvas.toDataURL("image/jpeg", 0.95)
    setCapturedImage(imageData)
    stopCamera()
  }

  const processImage = async () => {
    if (!capturedImage) return

    setProcessing(true)
    setError(null)

    try {
      // Importar dinámicamente para no cargarlo si no se usa
      const Tesseract = (await import("tesseract.js")).default

      const { data: { text } } = await Tesseract.recognize(capturedImage, 'eng', {
        logger: m => console.log(m)
      })

      console.log("OCR Result:", text)

      // Limpiar texto: quitar espacios, saltos de línea y pasarlo a mayúsculas
      const cleanText = text.replace(/[^A-Z0-9]/gi, "").toUpperCase()

      // Regex para patentes argentinas (AAA111 o AA111AA)
      const mercoRegex = /[A-Z]{2}\d{3}[A-Z]{2}/
      const oldRegex = /[A-Z]{3}\d{3}/

      const mercoMatch = cleanText.match(mercoRegex)
      const oldMatch = cleanText.match(oldRegex)

      const plate = mercoMatch ? mercoMatch[0] : (oldMatch ? oldMatch[0] : null)

      if (!plate) {
        throw new Error("No se pudo detectar una patente clara. Por favor intenta de nuevo.")
      }

      // El OCR solo nos da la patente de forma confiable. 
      // La marca y modelo seguirán siendo simulados por ahora o pedidos al usuario después.
      const scannedData = {
        brand: "Detectado",
        model: "Vehículo",
        year: String(new Date().getFullYear()),
        color: "N/A",
        licensePlate: plate,
      }

      setProcessing(false)
      onDataScanned(scannedData)
      handleClose()
    } catch (err: any) {
      console.error("OCR Error:", err)
      setError(err.message || "Error al procesar la imagen")
      setProcessing(false)
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setError(null)
    startCamera()
  }

  const handleClose = () => {
    stopCamera()
    setCapturedImage(null)
    setError(null)
    setProcessing(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose()
        }
        onOpenChange(isOpen)
      }}
    >
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Escanear Matrícula
          </DialogTitle>
          <DialogDescription>Captura una foto de la matrícula para extraer los datos automáticamente</DialogDescription>
        </DialogHeader>

        <div className="relative bg-black aspect-4/3">
          {cameraActive && <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />}

          {capturedImage && (
            <img
              src={capturedImage || "/placeholder.svg"}
              alt="Foto capturada"
              className="w-full h-full object-cover"
            />
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/80">
              <Alert variant="destructive" className="bg-red-900/90 border-red-700">
                <AlertDescription className="text-white">{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {processing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80">
              <Loader2 className="h-12 w-12 animate-spin text-white" />
              <div className="text-white text-center px-6">
                <p className="font-semibold mb-1">Procesando imagen...</p>
                <p className="text-sm text-white/70">Extrayendo datos de la matrícula</p>
              </div>
            </div>
          )}

          {/* Guía visual para centrar la placa */}
          {cameraActive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-primary rounded-sm w-4/5 h-1/3 flex items-center justify-center">
                <span className="text-white text-sm bg-black/50 px-3 py-1 rounded-sm">Centra la matrícula aquí</span>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-6 pt-4 space-y-3">
          {cameraActive && (
            <Button onClick={capturePhoto} className="w-full h-12 gap-2">
              <Camera className="h-5 w-5" />
              Capturar Foto
            </Button>
          )}

          {capturedImage && !processing && (
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={retakePhoto} variant="outline" className="h-12 gap-2 bg-transparent">
                <X className="h-4 w-4" />
                Volver a capturar
              </Button>
              <Button onClick={processImage} className="h-12 gap-2">
                <Check className="h-4 w-4" />
                Procesar
              </Button>
            </div>
          )}

          {error && !cameraActive && (
            <Button onClick={startCamera} variant="outline" className="w-full h-12 bg-transparent">
              Reintentar
            </Button>
          )}

          <Button onClick={() => onOpenChange(false)} variant="ghost" className="w-full">
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
