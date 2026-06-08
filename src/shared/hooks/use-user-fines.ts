import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchUserFines, payUserFine, appealUserFine, issueFine } from "@shared/api/user-fines"
import type { Fine } from "@shared/types"

/**
 * Hook: fetch all fines for a user.
 */
export function useUserFines(userId?: string) {
  return useQuery({
    queryKey: ["user_fines", userId],
    queryFn: () => fetchUserFines(userId!),
    enabled: !!userId,
  })
}

/**
 * Hook: pay a fine via Cloud Function.
 */
export function usePayUserFine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fineId: string) => payUserFine(fineId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user_fines"] }),
    onError: (error: any) => {
      console.error("Error paying fine", error)
      throw new Error(error.message || "Error al procesar el pago")
    },
  })
}

/**
 * Hook: appeal / contest a fine.
 */
export function useAppealUserFine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fineId: string) => appealUserFine(fineId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user_fines"] }),
  })
}

/**
 * Hook: issue a new fine (inspector).
 */
export function useIssueFine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof issueFine>[0]) => issueFine(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user_fines"] }),
  })
}

/** Derived helpers */
export function usePendingFines(userId?: string) {
  const { data: fines = [] } = useUserFines(userId)
  return fines.filter((f: Fine) => f.status === "pending")
}

export function useTotalPendingAmount(userId?: string) {
  const pending = usePendingFines(userId)
  return pending.reduce((sum: number, f: Fine) => sum + f.amount, 0)
}
