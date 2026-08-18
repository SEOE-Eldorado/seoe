"use client"

import { createContext, useContext, type ReactNode } from "react"
import { db } from "@shared/api/firebase"
import { doc, updateDoc, collection, getDocs, setDoc, getDoc, deleteDoc } from "firebase/firestore"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface SystemSettings {
    rates: {
        tier1: number // 1ra y 2da media hora
        tier2: number // 3ra y 4ta media hora
        tier3: number // 5ta en adelante
    }
    /**
     * Tarifas diferenciadas por día (opcional).
     * Si está presente, se usa la tarifa del día correspondiente.
     * Si NO está presente, se usa `rates` para todos los días (retrocompat).
     */
    ratesByDay?: {
        weekday?: { tier1: number; tier2: number; tier3: number } // lun-vie
        saturday?: { tier1: number; tier2: number; tier3: number }
        sunday?: { tier1: number; tier2: number; tier3: number }
        holiday?: { tier1: number; tier2: number; tier3: number }
    } | null
    operatingHours: {
        morning: { start: string; end: string }
        afternoon: { start: string; end: string }
    }
    operatingDays: number[] // 1-7 (Mon-Sun)
    paymentConfig?: {
        enableMacroClick: boolean
        enableCash: boolean
        promotions: {
            active: boolean
            minAmount: number
            bonusPercentage: number
        }
    }
    /**
     * Montos configurables de multas. Si NO está presente, el FineIssuer
     * usa los valores por defecto hardcoded (retrocompat).
     */
    fineAmounts?: {
        no_payment?: number
        expired_meter?: number
        wrong_zone?: number
    } | null
}

export interface Zone {
    id: string
    name: string
    description: string
    active: boolean
    center: { lat: number; lng: number }
    radius: number // in meters
    /**
     * Tarifa específica de esta zona. Si está presente, override la global.
     * Si es null/undefined, se usa settings.rates (global).
     */
    tariff?: {
        tier1: number
        tier2: number
        tier3: number
    } | null
}

export interface SpecialDay {
    id: string
    date: string // YYYY-MM-DD
    name: string
    type: "holiday" | "event"
    isFree: boolean
    customHours?: {
        morning: { start: string; end: string }
        afternoon: { start: string; end: string }
    }
}

interface SettingsContextType {
    settings: SystemSettings | null
    zones: Zone[]
    specialDays: SpecialDay[]
    updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>
    addZone: (zone: Omit<Zone, "id">) => Promise<void>
    updateZone: (id: string, zone: Partial<Zone>) => Promise<void>
    deleteZone: (id: string) => Promise<void>
    isOperatingTime: (date?: Date) => boolean
    isLocationInAnyZone: (lat?: number, lng?: number) => boolean
    getZoneAtLocation: (lat?: number, lng?: number) => Zone | null
    calculateCost: (hours: number, startHours?: number, lat?: number, lng?: number) => number
    loading: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const DEFAULT_SETTINGS: SystemSettings = {
    rates: {
        tier1: 50,
        tier2: 85,
        tier3: 130
    },
    operatingHours: {
        morning: { start: "08:00", end: "12:00" },
        afternoon: { start: "16:00", end: "20:00" }
    },
    operatingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
    paymentConfig: {
        enableMacroClick: true,
        enableCash: true,
        promotions: { active: false, minAmount: 500, bonusPercentage: 10 }
    }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient()

    // Global Settings Query
    const { data: settings = DEFAULT_SETTINGS, isLoading: loadingSettings } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const settingsRef = doc(db, "settings", "global")
            const docSnap = await getDoc(settingsRef)
            if (docSnap.exists()) {
                const data = docSnap.data()
                if (!data.paymentConfig) {
                    const migrated = { ...DEFAULT_SETTINGS, ...data }
                    if (!migrated.operatingDays) migrated.operatingDays = DEFAULT_SETTINGS.operatingDays
                    if (!migrated.paymentConfig) migrated.paymentConfig = DEFAULT_SETTINGS.paymentConfig
                    return migrated as SystemSettings
                }
                return data as SystemSettings
            } else {
                await setDoc(settingsRef, DEFAULT_SETTINGS)
                return DEFAULT_SETTINGS
            }
        },
        staleTime: 1000 * 60 * 60, // 1 hour cache
    })

    // Zones Query
    const { data: zones = [], isLoading: loadingZones } = useQuery({
        queryKey: ['zones'],
        queryFn: async () => {
            const zonesRef = collection(db, "zones")
            const snapshot = await getDocs(zonesRef)
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Zone[]
        },
        staleTime: 1000 * 60 * 60, // 1 hour 
    })

    // Special Days Query
    const { data: specialDays = [], isLoading: loadingSpecialDays } = useQuery({
        queryKey: ['specialDays'],
        queryFn: async () => {
            const specialRef = collection(db, "special_days")
            const snapshot = await getDocs(specialRef)
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SpecialDay[]
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    })

    const loading = loadingSettings || loadingZones || loadingSpecialDays

    // Mutations
    const updateSettingsMutation = useMutation({
        mutationFn: async (newSettings: Partial<SystemSettings>) => {
            const settingsRef = doc(db, "settings", "global")
            await updateDoc(settingsRef, newSettings)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] })
    })

    const addZoneMutation = useMutation({
        mutationFn: async (zoneData: Omit<Zone, "id">) => {
            const newZoneRef = doc(collection(db, "zones"))
            await setDoc(newZoneRef, zoneData)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zones'] })
    })

    const updateZoneMutation = useMutation({
        mutationFn: async ({ id, zoneData }: { id: string, zoneData: Partial<Zone> }) => {
            const zoneRef = doc(db, "zones", id)
            await updateDoc(zoneRef, zoneData)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zones'] })
    })

    const deleteZoneMutation = useMutation({
        mutationFn: async (id: string) => {
            const zoneRef = doc(db, "zones", id)
            await deleteDoc(zoneRef)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zones'] })
    })


    const isOperatingTime = (checkDate?: Date) => {
        const now = checkDate || new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const dateDay = String(now.getDate()).padStart(2, '0')
        const isoDate = `${year}-${month}-${dateDay}`

        const specialDay = specialDays.find(d => d.date === isoDate)

        const checkShift = (shift: { start: string; end: string }, targetTime: Date) => {
            if (!shift || !shift.start || !shift.end) return false
            const [startH, startM] = shift.start.split(":").map(Number)
            const [endH, endM] = shift.end.split(":").map(Number)
            const current = targetTime.getHours() * 60 + targetTime.getMinutes()
            const start = startH * 60 + startM
            const end = endH * 60 + endM
            return current >= start && current <= end
        }

        if (specialDay) {
            if (specialDay.isFree) return false
            if (specialDay.customHours) {
                return checkShift(specialDay.customHours.morning, now) || checkShift(specialDay.customHours.afternoon, now)
            }
        }

        if (!settings) return true

        const day = now.getDay()
        const adjustedDay = day === 0 ? 7 : day

        if (settings.operatingDays && !settings.operatingDays.includes(adjustedDay)) return false
        if (!settings.operatingHours) return false

        return checkShift(settings.operatingHours.morning, now) || checkShift(settings.operatingHours.afternoon, now)
    }

    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 6371e3; // metros
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    const isLocationInAnyZone = (lat?: number, lng?: number) => {
        if (!lat || !lng || !zones.length) return false;

        return zones.some(zone => {
            if (!zone.active) return false;
            const distance = calculateDistance(lat, lng, zone.center.lat, zone.center.lng);
            return distance <= zone.radius;
        });
    }

    const getZoneAtLocation = (lat?: number, lng?: number): Zone | null => {
        if (!lat || !lng || !zones.length) return null;

        return zones.find(zone => {
            if (!zone.active) return false;
            const distance = calculateDistance(lat, lng, zone.center.lat, zone.center.lng);
            return distance <= zone.radius;
        }) || null;
    }

    /**
     * Devuelve las tarifas aplicables para un stepTime dado.
     * Prioridad:
     *   1. Tarifa específica de la zona (si el step cae en una zona con tariff)
     *   2. Tarifa por día (si ratesByDay está configurado y tiene el día)
     *   3. Tarifa global
     */
    const getRatesForStep = (stepTime: Date, zone: Zone | null) => {
        if (zone && zone.tariff) return zone.tariff
        if (settings?.ratesByDay) {
            const isoDate = `${stepTime.getFullYear()}-${String(stepTime.getMonth() + 1).padStart(2, '0')}-${String(stepTime.getDate()).padStart(2, '0')}`
            const isHoliday = specialDays.find(d => d.date === isoDate && d.type === 'holiday')
            const dow = stepTime.getDay() // 0=Dom, 6=Sáb
            if (isHoliday && settings.ratesByDay.holiday) return settings.ratesByDay.holiday
            if (dow === 0 && settings.ratesByDay.sunday) return settings.ratesByDay.sunday
            if (dow === 6 && settings.ratesByDay.saturday) return settings.ratesByDay.saturday
            if (dow >= 1 && dow <= 5 && settings.ratesByDay.weekday) return settings.ratesByDay.weekday
        }
        return settings!.rates
    }

    const calculateCost = (hours: number, startHours: number = 0, lat?: number, lng?: number): number => {
        if (!settings || !settings.rates) return 0

        if (lat !== undefined && lng !== undefined) {
            if (!isLocationInAnyZone(lat, lng)) return 0;
        }

        let total = 0
        let effectiveHalfHours = 0
        const startTime = new Date()
        startTime.setMinutes(startTime.getMinutes() + (startHours * 60))

        // Determinar zona (si hay lat/lng)
        const zone = (lat !== undefined && lng !== undefined) ? getZoneAtLocation(lat, lng) : null

        const totalSteps = hours * 2
        for (let i = 0; i < totalSteps; i++) {
            const stepTime = new Date(startTime.getTime() + (i * 30 * 60 * 1000))

            if (isOperatingTime(stepTime)) {
                effectiveHalfHours++
                const rates = getRatesForStep(stepTime, zone)
                if (effectiveHalfHours <= 2) {
                    total += rates.tier1
                } else if (effectiveHalfHours <= 4) {
                    total += rates.tier2
                } else {
                    total += rates.tier3
                }
            }
        }

        return total
    }

    return (
        <SettingsContext.Provider value={{
            settings,
            zones,
            specialDays,
            updateSettings: async (newSettings) => await updateSettingsMutation.mutateAsync(newSettings),
            addZone: async (zone) => await addZoneMutation.mutateAsync(zone),
            updateZone: async (id, zone) => await updateZoneMutation.mutateAsync({ id, zoneData: zone }),
            deleteZone: async (id) => await deleteZoneMutation.mutateAsync(id),
            isOperatingTime,
            isLocationInAnyZone,
            getZoneAtLocation,
            calculateCost,
            loading
        }}>
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider")
    }
    return context
}
