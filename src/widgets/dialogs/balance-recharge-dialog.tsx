"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@shared/ui/atoms/dialog"
import { Button } from "@shared/ui/atoms/button"
import { Input } from "@shared/ui/atoms/input"
import { Label } from "@shared/ui/atoms/label"
import { CreditCard, Loader2 } from "lucide-react"
import { getFunctions, httpsCallable } from "firebase/functions"

interface BalanceRechargeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface MacroClickResponse {
  url: string;
  fields: Record<string, string>;
}

export function BalanceRechargeDialog({ open, onOpenChange }: BalanceRechargeDialogProps) {
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)

  // Hidden form ref to auto-submit
  const formRef = useRef<HTMLFormElement>(null)
  const [paymentData, setPaymentData] = useState<MacroClickResponse | null>(null)

  const predefinedAmounts = [50, 100, 200, 500]

  const handleRecharge = async () => {
    const value = Number.parseFloat(amount)
    if (isNaN(value) || value <= 0) {
      alert("Ingresa un monto válido")
      return
    }

    setLoading(true)
    try {
      const functions = getFunctions(undefined, 'us-central1');
      const createMacroClickPayment = httpsCallable<any, MacroClickResponse>(functions, 'createMacroClickPayment');

      const response = await createMacroClickPayment({ amount: value });
      const data = response.data;

      setPaymentData(data);

      // Wait for state update and render, then submit
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.submit();
        }
      }, 100);

    } catch (error) {
      console.error("Payment Error:", error);
      alert("Error iniciando el pago. Intente nuevamente.");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Recargar Saldo</DialogTitle>
          <DialogDescription>Selecciona o ingresa el monto que deseas agregar a tu cuenta</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Predefined amounts */}
          <div>
            <Label className="mb-3 block">Montos rápidos</Label>
            <div className="grid grid-cols-2 gap-3">
              {predefinedAmounts.map((preset) => (
                <Button
                  key={preset}
                  variant={amount === preset.toString() ? "default" : "outline"}
                  onClick={() => setAmount(preset.toString())}
                  className="h-14 text-lg font-semibold"
                >
                  ${preset}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div className="space-y-2">
            <Label htmlFor="custom-amount">Monto personalizado</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="custom-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 text-lg"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-muted rounded-sm p-4 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium text-sm">Macro Click de Pago</p>
              <p className="text-xs text-muted-foreground">Tarjeta de Crédito / Débito</p>
            </div>
          </div>

          <Button onClick={handleRecharge} disabled={!amount || loading} className="w-full h-12 text-lg">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirigiendo...</> : `Pagar $${amount || "0.00"}`}
          </Button>

          {/* Hidden Form for Redirection */}
          {paymentData && (
            <form
              ref={formRef}
              action={paymentData.url}
              method="POST"
              className="hidden"
            >
              {Object.entries(paymentData.fields).map(([key, value]) => (
                <input key={key} type="hidden" name={key} value={value} />
              ))}
              {/* Force 'Producto' based on manual example if needed, but we rely on Cloud Function fields */}
              {/* 
                  Note: The Cloud Function should return ALL necessary fields including
                  Producto[0], MontoProducto[0] if required.
                  Plan assumed basic fields; if 'Producto' is mandatory, check PDF.
                  PDF Section 3.3 says 'Producto' is NOT optional? "Descripción de los productos...".
                  Wait, 'Observaciones' column says "-" which usually implies Mandatory?
                  But 'MontoProducto' says "Opcional".
                  Let's assume we need at least one product description.
                  We will rely on the server to send it in 'fields' map.
                  (Updated server function to include simple product description if missing)
                */}
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
