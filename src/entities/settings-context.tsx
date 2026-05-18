"use client"

import { createContext, useContext, type ReactNode } from "react"
import { db } from "@shared/api/firebase"
import { doc, updateDoc, collection, getDocs, setDoc, getDoc } from "firebase/firestore"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface SystemSettings {
    rates: {
        tier1: number // 1ra y 2da media hora
        tier2: number // 3ra y 4ta media hora
        tier3: number // 5ta en adelante
    }
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
}

export interface Zone {
    id: string
    name: string
    description: string
    active: boolean
    center: { lat: number; lng: number }
    radius: number // in meters
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

    const calculateCost = (hours: number, startHours: number = 0, lat?: number, lng?: number): number => {
        if (!settings || !settings.rates) return 0

        if (lat !== undefined && lng !== undefined) {
            if (!isLocationInAnyZone(lat, lng)) return 0;
        }

        let total = 0
        let effectiveHalfHours = 0
        const startTime = new Date()
        startTime.setMinutes(startTime.getMinutes() + (startHours * 60))

        const totalSteps = hours * 2
        for (let i = 0; i < totalSteps; i++) {
            const stepTime = new Date(startTime.getTime() + (i * 30 * 60 * 1000))

            if (isOperatingTime(stepTime)) {
                effectiveHalfHours++
                if (effectiveHalfHours <= 2) {
                    total += settings.rates.tier1
                } else if (effectiveHalfHours <= 4) {
                    total += settings.rates.tier2
                } else {
                    total += settings.rates.tier3
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
