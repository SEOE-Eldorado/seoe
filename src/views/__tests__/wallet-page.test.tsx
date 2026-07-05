import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WalletPage } from '../wallet-page'
import { useAuth } from '@entities/auth-context'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: vi.fn(),
    push: vi.fn(),
  }),
}))

// Mock Auth context
vi.mock('@entities/auth-context', () => ({
  useAuth: vi.fn(),
}))

// Mock dialogs and widgets
vi.mock('@widgets/dialogs/balance-recharge-dialog', () => ({
  BalanceRechargeDialog: () => <div data-testid="balance-recharge-dialog">Recharge</div>,
}))

vi.mock('@widgets/transaction-history', () => ({
  TransactionHistory: () => <div data-testid="transaction-history">History</div>,
}))

const mocuseAuth = vi.mocked(useAuth)

describe('WalletPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocuseAuth.mockReturnValue({
      user: { id: 'test-user', name: 'Test', balance: 1000, autoPayFines: false },
      toggleAutoPayFines: vi.fn(),
    } as any)
  })

  it('should render without crashing', () => {
    const { container } = render(<WalletPage />)
    expect(container).toBeDefined()
  })

  it('should display the wallet title', () => {
    render(<WalletPage />)
    expect(screen.getByText('Mi Billetera')).toBeDefined()
  })

  it('should display the user balance', () => {
    render(<WalletPage />)
    expect(screen.getByText('1.000')).toBeDefined()
  })

  it('should render the recharge dialog', () => {
    render(<WalletPage />)
    expect(screen.getByTestId('balance-recharge-dialog')).toBeDefined()
  })

  it('should render load balance button', () => {
    render(<WalletPage />)
    expect(screen.getByText('CARGAR SALDO')).toBeDefined()
  })
})
