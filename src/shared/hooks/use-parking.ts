import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchActiveSessions, startParking, extendParking, endParking, checkPlateStatus } from "@shared/api/parking"
import type { ParkingSession } from "@entities/parking-context"

export function useActiveSessions(userId?: string) {
  return useQuery({
    queryKey: ["parking_sessions", userId],
    queryFn: () => fetchActiveSessions(userId!),
    enabled: !!userId,
    refetchInterval: 30000,
  })
}

export function useCheckPlateStatus() {
  return useMutation({
    mutationFn: (plate: string) => checkPlateStatus(plate),
  })
}

export function useStartParking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof startParking>[0]) => startParking(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["parking_sessions", variables.userId] })
      queryClient.invalidateQueries({ queryKey: ["user", variables.userId] })
    },
  })
}

export function useExtendParking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, additionalHours, cost }: { sessionId: string; additionalHours: number; cost: number }) =>
      extendParking(sessionId, additionalHours, cost),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking_sessions"] })
    },
  })
}

export function useEndParking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => endParking(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking_sessions"] })
    },
  })
}
