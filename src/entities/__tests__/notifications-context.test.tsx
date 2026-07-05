import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationsProvider, useNotifications } from '../notifications-context'
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
  orderBy: vi.fn(),
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
      <NotificationsProvider>{children}</NotificationsProvider>
    </QueryClientProvider>
  )
}

describe('NotificationsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuth as any).mockReturnValue({
      user: { id: 'test-user', name: 'Test User' },
    })
  })

  it('should settle into loaded state with default values', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).toBeDefined()
      expect(Array.isArray(result.current.notifications)).toBe(true)
    }, { timeout: 5000 })

    expect(result.current.notifications).toHaveLength(0)
    expect(result.current.getUnreadCount()).toBe(0)
    expect(result.current.getUrgentNotifications()).toEqual([])
    expect(typeof result.current.addNotification).toBe('function')
    expect(typeof result.current.markAsRead).toBe('function')
    expect(typeof result.current.markAllAsRead).toBe('function')
    expect(typeof result.current.clearNotification).toBe('function')

    // Verify async methods return Promises
    expect(result.current.addNotification({
      type: 'system', title: 'Test', message: 'Test',
    })).toBeInstanceOf(Promise)
    expect(result.current.markAsRead('notif-1')).toBeInstanceOf(Promise)
    expect(result.current.markAllAsRead()).toBeInstanceOf(Promise)
    expect(result.current.clearNotification('notif-1')).toBeInstanceOf(Promise)

    // Verify customId variant
    expect(result.current.addNotification({
      type: 'system', title: 'Test', message: 'Test', customId: 'custom-123',
    })).toBeInstanceOf(Promise)
  })

  it('should throw error if used outside of provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useNotifications())).toThrow(
      'useNotifications must be used within a NotificationsProvider'
    )
    consoleSpy.mockRestore()
  })
})
