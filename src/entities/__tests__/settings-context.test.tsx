import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SettingsProvider, useSettings } from '../settings-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

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
  getDocs: vi.fn().mockResolvedValue({
    docs: [],
    forEach: () => {},
    map: () => [],
  }),
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => false,
  }),
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date }),
    now: () => ({ toDate: () => new Date() }),
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
      <SettingsProvider>{children}</SettingsProvider>
    </QueryClientProvider>
  )
}

describe('SettingsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should settle into loaded state with default settings', async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).toBeDefined()
      expect(result.current.settings).toBeDefined()
    }, { timeout: 5000 })

    // Default settings
    expect(result.current.settings?.rates.tier1).toBe(50)
    expect(result.current.settings?.rates.tier2).toBe(85)
    expect(result.current.settings?.rates.tier3).toBe(130)
    expect(Array.isArray(result.current.zones)).toBe(true)
    expect(Array.isArray(result.current.specialDays)).toBe(true)

    // Helper functions
    expect(typeof result.current.isOperatingTime).toBe('function')
    expect(typeof result.current.isLocationInAnyZone).toBe('function')
    expect(typeof result.current.getZoneAtLocation).toBe('function')
    expect(typeof result.current.calculateCost).toBe('function')

    // Logic tests
    const monday10am = new Date('2026-04-13T10:00:00')
    expect(typeof result.current.isOperatingTime(monday10am)).toBe('boolean')
    expect(result.current.isLocationInAnyZone(-34.6037, -58.3816)).toBe(false)
    expect(result.current.getZoneAtLocation(-34.6037, -58.3816)).toBeNull()
    const cost = result.current.calculateCost(2)
    expect(typeof cost).toBe('number')
    expect(cost).toBeGreaterThanOrEqual(0)

    // Async methods return Promises
    expect(result.current.updateSettings({
      rates: { tier1: 60, tier2: 95, tier3: 140 }
    })).toBeInstanceOf(Promise)
    expect(result.current.addZone({
      name: 'Zone A', description: 'Test', active: true,
      center: { lat: -34.6037, lng: -58.3816 }, radius: 500,
    })).toBeInstanceOf(Promise)
    expect(result.current.updateZone('zone-1', { name: 'Updated' })).toBeInstanceOf(Promise)
    expect(result.current.deleteZone('zone-1')).toBeInstanceOf(Promise)
  })

  it('should throw error if used outside of provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useSettings())).toThrow(
      'useSettings must be used within a SettingsProvider'
    )
    consoleSpy.mockRestore()
  })
})
