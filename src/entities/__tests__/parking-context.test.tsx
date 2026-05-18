import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ParkingProvider, useParking } from '../parking-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useAuth } from '../auth-context'
import { useVehicles } from '../vehicles-context'
import { useQuery, useMutation } from '@tanstack/react-query'

// Mock the dependencies
vi.mock('../auth-context', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../vehicles-context', () => ({
  useVehicles: vi.fn(),
}))

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(() => ({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
    })),
  }
})

// Mock Firebase logic to avoid hitting real emulators during simple unit tests 
// (though emulators are configured, unit tests are often faster with mocks)
vi.mock('@shared/api/firebase', () => ({
  db: {},
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  runTransaction: vi.fn(),
  doc: vi.fn(),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date }),
  },
  setDoc: vi.fn(),
  addDoc: vi.fn(),
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
      <ParkingProvider>{children}</ParkingProvider>
    </QueryClientProvider>
  )
}

describe('ParkingContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuth as any).mockReturnValue({
      user: { id: 'test-user', balance: 100 },
    })
    ;(useVehicles as any).mockReturnValue({
      vehicles: [{ id: 'veh-1', licensePlate: 'ABC 123' }],
    })
    ;(useQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
    })
  })

  it('should calculate remaining time correctly', async () => {
    // Set a fixed time
    const now = new Date('2026-04-13T10:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(now)

    const { result } = renderHook(() => useParking(), { wrapper: createWrapper() })

    const endTime = new Date(now.getTime() + 65 * 60 * 1000) 

    const mockSession = {
      id: 'session-1',
      userId: 'test-user',
      vehicleId: 'veh-1',
      vehiclePlate: 'ABC 123',
      zone: 'Zone A',
      address: 'Test St',
      startTime: now,
      endTime,
      cost: 10,
      costPerHour: 5,
      status: 'active' as const,
    }

    const remaining = result.current.getRemainingTime(mockSession)
    expect(remaining).toEqual({ hours: 1, minutes: 5 })
    
    vi.useRealTimers()
  })

  it('should throw error if used outside of provider', () => {
    // Suppress console error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => renderHook(() => useParking())).toThrow('useParking must be used within a ParkingProvider')
    
    consoleSpy.mockRestore()
  })
})
