import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FinesProvider, useFines } from '../fines-context'
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
  updateDoc: vi.fn(),
  addDoc: vi.fn(),
  setDoc: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date }),
    now: () => ({ toDate: () => new Date() }),
  },
}))

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(() => vi.fn().mockResolvedValue({})),
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
      <FinesProvider>{children}</FinesProvider>
    </QueryClientProvider>
  )
}

describe('FinesContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuth as any).mockReturnValue({
      user: { id: 'test-user', name: 'Test User' },
    })
  })

  it('should settle into loaded state with default values', async () => {
    const { result } = renderHook(() => useFines(), { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(result.current).toBeDefined()
      expect(result.current.fines).toBeDefined()
    }, { timeout: 5000 })
    
    expect(result.current.fines).toHaveLength(0)
    expect(typeof result.current.payFine).toBe('function')
    expect(typeof result.current.getPendingFines).toBe('function')
    expect(typeof result.current.getTotalPendingAmount).toBe('function')
    expect(result.current.getPendingFines()).toHaveLength(0)
    expect(result.current.getTotalPendingAmount()).toBe(0)
  })

  it('should throw error if used outside of provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useFines())).toThrow(
      'useFines must be used within a FinesProvider'
    )
    consoleSpy.mockRestore()
  })
})
