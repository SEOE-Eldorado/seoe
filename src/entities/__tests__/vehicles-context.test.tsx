import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VehiclesProvider, useVehicles } from '../vehicles-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useAuth } from '../auth-context'

vi.mock('../auth-context', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@shared/api/firebase', () => ({
  db: {},
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ forEach: () => {} }),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  setDoc: vi.fn(),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date }),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <VehiclesProvider>{children}</VehiclesProvider>
    </QueryClientProvider>
  )
}

describe('VehiclesContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuth as any).mockReturnValue({
      user: { id: 'test-user', balance: 100 },
    })
  })

  it('should settle into loaded state with default values', async () => {
    const { result } = renderHook(() => useVehicles(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).toBeDefined()
      expect(Array.isArray(result.current.vehicles)).toBe(true)
    }, { timeout: 5000 })

    expect(result.current.vehicles).toHaveLength(0)
    expect(result.current.getDefaultVehicle()).toBeNull()
    expect(result.current.getDocumentAlerts()).toEqual([])
    expect(typeof result.current.addVehicle).toBe('function')
    expect(typeof result.current.removeVehicle).toBe('function')
    expect(typeof result.current.setDefaultVehicle).toBe('function')
    expect(typeof result.current.updateVehicle).toBe('function')
    expect(result.current.addVehicle({
      brand: 'Ford', model: 'Fiesta', year: '2019',
      color: 'Rojo', licensePlate: 'XYZ 789', isDefault: false,
    })).toBeInstanceOf(Promise)
    expect(result.current.removeVehicle('veh-1')).toBeInstanceOf(Promise)
    expect(result.current.setDefaultVehicle('veh-1')).toBeInstanceOf(Promise)
    expect(result.current.updateVehicle('veh-1', { color: 'Azul' })).toBeInstanceOf(Promise)
  })

  it('should throw error if used outside of provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useVehicles())).toThrow(
      'useVehicles must be used within a VehiclesProvider'
    )
    consoleSpy.mockRestore()
  })
})
