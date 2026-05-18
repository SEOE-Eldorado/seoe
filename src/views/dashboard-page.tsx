"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@entities/auth-context"
import { useParking } from "@entities/parking-context"
import { useNotifications } from "@entities/notifications-context"
import { useFines } from "@entities/fines-context"
import { Button } from "@shared/ui/atoms/button"
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/atoms/card"
import { Badge } from "@shared/ui/atoms/badge"
import {
  ParkingSquare,
  Wallet,
  Car,
  Receipt,
  Bell,
  User,
  Clock,
  LogOut,
  Plus,
  TrendingUp,
  MapPin,
  History,
  Menu,
  AlertTriangle,
} from "lucide-react"
import { BalanceRechargeDialog } from "@widgets/dialogs/balance-recharge-dialog"
import { TransactionHistory } from "@widgets/transaction-history"
import { VehiclesPage } from "@views/vehicles-page"
import { FinesPage } from "@views/fines-page"
import { ProfilePage } from "@views/profile-page"
import { HistoryPage } from "@views/history-page"
import { StartParkingDialog } from "@widgets/dialogs/start-parking-dialog"
import { ExtendParkingDialog } from "@widgets/dialogs/extend-parking-dialog"
import { NotificationsPanel } from "@widgets/notifications-panel"
import { UrgentAlertBanner } from "@shared/ui/molecules/urgent-alert-banner"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@shared/ui/atoms/sheet"

export function DashboardPage() {
  const { user, logout } = useAuth()
  const { activeSession, endParking, getRemainingTime } = useParking()
  const { getUnreadCount } = useNotifications()
  const { getPendingFines, getTotalPendingAmount } = useFines()
  const [showRechargeDialog, setShowRechargeDialog] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showVehicles, setShowVehicles] = useState(false)
  const [showFines, setShowFines] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showHistoryPage, setShowHistoryPage] = useState(false)
  const [showStartParking, setShowStartParking] = useState(false)
  const [showExtendParking, setShowExtendParking] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [remainingTime, setRemainingTime] = useState<{ hours: number; minutes: number } | null>(null)

  const unreadCount = getUnreadCount()
  const pendingFines = getPendingFines()
  const totalPendingAmount = getTotalPendingAmount()

  useEffect(() => {
    if (activeSession) {
      const updateTime = () => {
        setRemainingTime(getRemainingTime())
      }

      updateTime()
      const interval = setInterval(updateTime, 60000)

      return () => clearInterval(interval)
    }
  }, [activeSession, getRemainingTime])

  const handleEndParking = () => {
    if (activeSession && confirm("¿Estás seguro de finalizar este estacionamiento?")) {
      endParking(activeSession.id)
    }
  }

  if (showVehicles) {
    return <VehiclesPage onBack={() => setShowVehicles(false)} />
  }

  if (showFines) {
    return <FinesPage onBack={() => setShowFines(false)} />
  }

  if (showProfile) {
    return <ProfilePage onBack={() => setShowProfile(false)} />
  }

  if (showHistoryPage) {
    return <HistoryPage onBack={() => setShowHistoryPage(false)} />
  }

  const isExpired = activeSession?.status === "expired"
  const isNegativeBalance = (user?.balance ?? 0) < 0

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4 sticky top-0 z-50 shadow-md">
        <div className="container max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ParkingSquare className="h-6 w-6" />
            <h1 className="text-xl font-bold">SEOE</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20 relative"
              onClick={() => setShowNotifications(true)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <Sheet open={showMenu} onOpenChange={setShowMenu}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-80 bg-background/95 backdrop-blur-md">
                <SheetHeader className="pb-6 border-b">
                  <SheetTitle className="text-xl flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    Menú Principal
                  </SheetTitle>
                </SheetHeader>
                <div className="space-y-2 mt-6">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-base hover:bg-primary/10 hover:text-primary transition-all"
                    onClick={() => {
                      setShowMenu(false)
                      setShowProfile(true)
                    }}
                  >
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    Mi Perfil
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-base hover:bg-primary/10 hover:text-primary transition-all"
                    onClick={() => {
                      setShowMenu(false)
                      setShowHistoryPage(true)
                    }}
                  >
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <History className="h-5 w-5 text-primary" />
                    </div>
                    Historial Completo
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-base hover:bg-emerald-500/10 hover:text-emerald-600 transition-all"
                    onClick={() => {
                      setShowMenu(false)
                      setShowVehicles(true)
                    }}
                  >
                    <div className="bg-emerald-500/10 p-2 rounded-lg">
                      <Car className="h-5 w-5 text-emerald-600" />
                    </div>
                    Mis Vehículos
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-base hover:bg-amber-500/10 hover:text-amber-600 transition-all"
                    onClick={() => {
                      setShowMenu(false)
                      setShowFines(true)
                    }}
                  >
                    <div className="bg-amber-500/10 p-2 rounded-lg">
                      <Receipt className="h-5 w-5 text-amber-600" />
                    </div>
                    Multas
                  </Button>
                  <div className="pt-6 border-t mt-6">
                    <Button
                      variant="destructive"
                      className="w-full gap-3 h-12 text-base shadow-md hover:shadow-lg transition-all"
                      onClick={() => {
                        setShowMenu(false)
                        logout()
                      }}
                    >
                      <LogOut className="h-5 w-5" />
                      Cerrar Sesión
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Urgent Alert Banner */}
      <UrgentAlertBanner />

      <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
        {/* User Info Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90">Bienvenido</p>
                <h2 className="text-2xl font-bold text-balance">{user?.name}</h2>
              </div>
              <div className="bg-primary-foreground/20 p-3 rounded-full">
                <User className="h-6 w-6" />
              </div>
            </div>
            <div className="bg-primary-foreground/10 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                <div className="flex-1">
                  <p className="text-xs opacity-90">Saldo Disponible</p>
                  <p className={`text-3xl font-bold ${isNegativeBalance ? "text-red-200" : ""}`}>
                    ${user?.balance.toFixed(2)}
                  </p>
                  {isNegativeBalance && (
                    <p className="text-xs text-red-200 mt-1">
                      Crédito utilizado: ${Math.abs(user?.balance ?? 0).toFixed(2)} de $1000
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="secondary" onClick={() => setShowRechargeDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Recargar
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setShowHistory(!showHistory)} className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Historial
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {showHistory && <TransactionHistory />}

        {isNegativeBalance && (
          <Card className="border-2 border-amber-500 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="bg-amber-500/10 p-2 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 mb-1">Saldo Negativo</h3>
                  <p className="text-sm text-amber-700">
                    Estás utilizando crédito. Has usado ${Math.abs(user?.balance ?? 0).toFixed(2)} de $1000 disponibles.
                    Recarga tu saldo para evitar alcanzar el límite.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {pendingFines.length > 0 && (
          <Card className="border-2 border-destructive bg-destructive/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <CardTitle className="text-lg text-destructive">Multas Pendientes</CardTitle>
                </div>
                <Badge className="bg-destructive text-destructive-foreground">{pendingFines.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Tienes {pendingFines.length} {pendingFines.length === 1 ? "multa pendiente" : "multas pendientes"} de
                  pago
                </p>
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Total a pagar</p>
                    <p className="text-2xl font-bold text-destructive">${totalPendingAmount.toFixed(2)}</p>
                  </div>
                  <Receipt className="h-8 w-8 text-destructive/40" />
                </div>
              </div>
              <Button className="w-full" variant="destructive" onClick={() => setShowFines(true)}>
                Ver y Pagar Multas
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Active Parking */}
        {activeSession ? (
          <Card className={`border-2 ${isExpired ? "border-destructive" : "border-accent"}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Estacionamiento Activo</CardTitle>
                <Badge
                  className={
                    isExpired ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground"
                  }
                >
                  {isExpired ? "Expirado" : "Activo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-lg">
                    <Car className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Vehículo</p>
                    <p className="font-semibold">{activeSession.vehiclePlate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-lg">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Ubicación</p>
                    <p className="font-semibold text-sm">{activeSession.zone}</p>
                    <p className="text-xs text-muted-foreground">{activeSession.address}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-muted p-2 rounded-lg">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Hora de inicio</p>
                      <p className="font-semibold text-sm">
                        {new Date(activeSession.startTime).toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-muted p-2 rounded-lg">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Hora de fin</p>
                      <p className="font-semibold text-sm">
                        {new Date(activeSession.endTime).toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`bg-muted p-2 rounded-lg ${isExpired ? "bg-destructive/10" : ""}`}>
                    <Clock className={`h-4 w-4 ${isExpired ? "text-destructive" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Tiempo restante</p>
                    <p className={`text-2xl font-bold ${isExpired ? "text-destructive" : ""}`}>
                      {remainingTime ? `${remainingTime.hours}h ${remainingTime.minutes}min` : "0h 0min"}
                    </p>
                  </div>
                </div>
                {isExpired && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                    Tu tiempo de estacionamiento ha expirado. Finaliza la sesión o extiéndela para evitar multas.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => setShowExtendParking(true)}
                  disabled={isExpired}
                >
                  Extender
                </Button>
                <Button variant="destructive" className="w-full" onClick={handleEndParking}>
                  Finalizar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <div className="bg-muted p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <ParkingSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">No hay estacionamiento activo</p>
              <Button className="w-full" onClick={() => setShowStartParking(true)}>
                Iniciar Estacionamiento
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => setShowVehicles(true)}>
            <CardContent className="pt-6 text-center">
              <div className="bg-primary/10 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium text-sm">Mis Vehículos</p>
            </CardContent>
          </Card>
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => setShowFines(true)}>
            <CardContent className="pt-6 text-center">
              <div className="bg-destructive/10 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-destructive" />
              </div>
              <p className="font-medium text-sm">Multas</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-foreground">Actividad Reciente</h3>
            <Button variant="ghost" size="sm" className="text-primary text-xs font-bold" onClick={() => setShowHistory(true)}>
              VER TODO
            </Button>
          </div>
          <TransactionHistory limit={3} showTitle={false} />
        </section>
      </div>

      <BalanceRechargeDialog open={showRechargeDialog} onOpenChange={setShowRechargeDialog} />
      <StartParkingDialog open={showStartParking} onOpenChange={setShowStartParking} />
      {activeSession && <ExtendParkingDialog open={showExtendParking} onOpenChange={setShowExtendParking} session={activeSession} />}
      <NotificationsPanel open={showNotifications} onOpenChange={setShowNotifications} />
    </div>
  )
}
