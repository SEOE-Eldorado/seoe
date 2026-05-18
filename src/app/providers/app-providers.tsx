"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query"
import * as Sentry from "@sentry/nextjs"

import type { ReactNode } from "react"
import { AuthProvider } from "@entities/auth-context"
import { VehiclesProvider } from "@entities/vehicles-context"
import { ParkingProvider } from "@entities/parking-context"
import { FinesProvider } from "@entities/fines-context"
import { NotificationsProvider } from "@entities/notifications-context"
import { GeolocationProvider } from "@entities/geolocation-context"
import { SettingsProvider } from "@entities/settings-context"
import { Toaster } from "@shared/ui/atoms/toaster"
import { InstallPrompt } from "@shared/ui/atoms/install-prompt"
import { NetworkStatus } from "@shared/ui/atoms/network-status"
import { PushNotificationPrompt } from "@widgets/push-notification-prompt"

export function AppProviders({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        queryCache: new QueryCache({
            onError: (error) => {
                Sentry.captureException(error);
            },
        }),
        mutationCache: new MutationCache({
            onError: (error) => {
                Sentry.captureException(error);
            },
        }),
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60 * 5, // 5 minutos de cache (Ahorro costo Firebase)
                refetchOnWindowFocus: false,
            },
        },
    }))

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <SettingsProvider>
                    <VehiclesProvider>
                        <GeolocationProvider>
                            <ParkingProvider>
                                <FinesProvider>
                                    <NotificationsProvider>
                                        {children}
                                        <Toaster />
                                        <InstallPrompt />
                                        <NetworkStatus />
                                        <PushNotificationPrompt />
                                    </NotificationsProvider>
                                </FinesProvider>
                            </ParkingProvider>
                        </GeolocationProvider>
                    </VehiclesProvider>
                </SettingsProvider>
            </AuthProvider>
        </QueryClientProvider>
    )
}
