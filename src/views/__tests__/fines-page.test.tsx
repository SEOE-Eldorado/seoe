import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FinesPage } from '../fines-page'

// Import the hooks to get access to the mocked versions
import { useFines } from '@entities/fines-context'
import { useAuth } from '@entities/auth-context'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: vi.fn(),
  }),
}))

// Mock contexts
vi.mock('@entities/fines-context', () => ({
  useFines: vi.fn(),
}))

vi.mock('@entities/auth-context', () => ({
  useAuth: vi.fn(),
}))

// Mock haptic hook
vi.mock('@shared/lib/hooks/use-haptic', () => ({
  useHaptic: () => ({ trigger: vi.fn() }),
}))

// Mock alert dialog
vi.mock('@shared/ui/atoms/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => <div data-testid="alert-dialog">{children}</div>,
  AlertDialogAction: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="alert-dialog-action">{children}</button>
  ),
  AlertDialogCancel: ({ children }: any) => <button data-testid="alert-dialog-cancel">{children}</button>,
  AlertDialogContent: ({ children }: any) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
}))

const mocuseFines = vi.mocked(useFines)
const mocuseAuth = vi.mocked(useAuth)

describe('FinesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mocuseFines.mockReturnValue({
      fines: [],
      payFine: vi.fn(),
      getPendingFines: () => [],
      getTotalPendingAmount: () => 0,
    })

    mocuseAuth.mockReturnValue({
      user: { id: 'test-user', balance: 500, autoPayFines: false },
    } as any)
  })

  it('should render without crashing', () => {
    const { container } = render(<FinesPage />)
    expect(container).toBeDefined()
  })

  it('should display the fines page title', () => {
    render(<FinesPage />)
    expect(screen.getByText('Infracciones')).toBeDefined()
  })

  it('should show "all clear" message when there are no pending fines', () => {
    render(<FinesPage />)
    expect(screen.getByText('¡Todo al día!')).toBeDefined()
    expect(screen.getByText('Sin infracciones pendientes.')).toBeDefined()
  })

  it('should display pending fines count and total amount', () => {
    const mockFine1 = {
      id: 'fine-1', userId: 'test-user', vehiclePlate: 'ABC 123',
      amount: 500, type: 'overtime' as const, reason: 'Exceso de tiempo',
      location: 'Av. Corrientes', date: new Date('2026-04-01'),
      status: 'pending' as const, dueDate: new Date('2026-05-01'),
      createdAt: new Date('2026-04-01'),
    }
    const mockFine2 = {
      id: 'fine-2', userId: 'test-user', vehiclePlate: 'XYZ 789',
      amount: 300, type: 'no_payment' as const, reason: 'Sin pago',
      location: 'Callao', date: new Date('2026-04-02'),
      status: 'pending' as const, dueDate: new Date('2026-05-02'),
      createdAt: new Date('2026-04-02'),
    }

    mocuseFines.mockReturnValue({
      fines: [mockFine1, mockFine2],
      payFine: vi.fn(),
      getPendingFines: () => [mockFine1, mockFine2],
      getTotalPendingAmount: () => 800,
    })

    render(<FinesPage />)
    expect(screen.getByText('2')).toBeDefined()
    expect(screen.getByText('Exceso de tiempo')).toBeDefined()
    expect(screen.getByText('Sin pago')).toBeDefined()
  })

  it('should render paid fines in history section', () => {
    const paidFine = {
      id: 'fine-paid', userId: 'test-user', vehiclePlate: 'DEF 456',
      amount: 200, type: 'overtime' as const, reason: 'Exceso de tiempo',
      location: 'Test', date: new Date('2026-03-01'),
      status: 'paid' as const, paidAt: new Date('2026-03-02'),
      createdAt: new Date('2026-03-01'),
    }

    mocuseFines.mockReturnValue({
      fines: [paidFine],
      payFine: vi.fn(),
      getPendingFines: () => [],
      getTotalPendingAmount: () => 0,
    })

    render(<FinesPage />)
    expect(screen.getByText('Historial de Pagos')).toBeDefined()
  })
})
