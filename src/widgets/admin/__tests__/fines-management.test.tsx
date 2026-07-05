import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FinesManagement } from '../fines-management'
import { useAllFines, useCancelFine, useMarkFinePaid } from '@shared/api/admin-fines'

// Mock admin-fines API hooks
vi.mock('@shared/api/admin-fines', () => ({
  useAllFines: vi.fn(),
  useCancelFine: vi.fn(),
  useMarkFinePaid: vi.fn(),
}))

// Mock UI components
vi.mock('@shared/ui/atoms/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@shared/ui/atoms/button', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="button">
      {children}
    </button>
  ),
}))

vi.mock('@shared/ui/atoms/input', () => ({
  Input: ({ value, onChange, placeholder, type }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      data-testid="input"
    />
  ),
}))

vi.mock('@shared/ui/atoms/badge', () => ({
  Badge: ({ children, variant, className }: any) => <span className={className} data-testid="badge">{children}</span>,
}))

vi.mock('@shared/ui/atoms/select', () => ({
  Select: ({ children }: any) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@shared/ui/atoms/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react') as any
  return {
    ...actual,
    BarChart3: () => '🔢',
    Edit2: () => '✏️',
    FileDown: () => '📥',
    Car: () => '🚗',
    Calendar: () => '📅',
    User: () => '👤',
    DollarSign: () => '💵',
    Shield: () => '🛡',
    ArrowUpDown: () => '↕',
    MoreHorizontal: () => '⋯',
    MapPin: () => '📍',
    AlertCircle: () => '⚠',
    Search: () => '🔍',
    Filter: () => '🎛',
    Download: () => '💾',
    AlertTriangle: () => '⚡',
    XCircle: () => '❌',
    CheckCircle: () => '✅',
    Clock: () => '⏰',
    FileText: () => '📄',
  }
})

describe('FinesManagement (Admin Widget)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useCancelFine).mockReturnValue({
      mutateAsync: vi.fn(),
    } as any)
    vi.mocked(useMarkFinePaid).mockReturnValue({
      mutateAsync: vi.fn(),
    } as any)
  })

  it('should render without crashing', () => {
    vi.mocked(useAllFines).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)
    const { container } = render(<FinesManagement />)
    expect(container).toBeDefined()
  })

  it('should display the management header', () => {
    vi.mocked(useAllFines).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)
    render(<FinesManagement />)
    expect(screen.getByText('Gestión de Multas')).toBeDefined()
  })

  it('should show "no fines" empty state', () => {
    vi.mocked(useAllFines).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)
    render(<FinesManagement />)
    expect(screen.getByText('No se encontraron multas')).toBeDefined()
  })

  it('should render stat cards with zeros', () => {
    vi.mocked(useAllFines).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)
    render(<FinesManagement />)
    expect(screen.getByText('TOTAL EMITIDAS')).toBeDefined()
    expect(screen.getByText('PENDIENTES PAGO')).toBeDefined()
    expect(screen.getByText('RECAUDADO HOY')).toBeDefined()
    expect(screen.getByText('ANULADAS')).toBeDefined()
  })

  it('should render filter input', () => {
    vi.mocked(useAllFines).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)
    render(<FinesManagement />)
    const inputs = screen.getAllByTestId('input')
    const filterInput = inputs.find(i => i.getAttribute('placeholder') === 'Filtrar patente...')
    expect(filterInput).toBeDefined()
  })

  it('should render export CSV button', () => {
    vi.mocked(useAllFines).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)
    render(<FinesManagement />)
    const buttons = screen.getAllByRole('button')
    const exportBtn = buttons.find(b => b.textContent?.includes('Exportar CSV'))
    expect(exportBtn).toBeDefined()
  })

  it('should show fines when data is provided', () => {
    vi.mocked(useAllFines).mockReturnValue({
      data: [
        { id: 'fine-1', vehiclePlate: 'ABC 123', amount: 8000, type: 'expired_meter', status: 'pending', date: new Date('2026-06-01'), zone: 'Zone A', reason: 'Tiempo Expirado' },
        { id: 'fine-2', vehiclePlate: 'DEF 456', amount: 12000, type: 'no_payment', status: 'paid', date: new Date('2026-06-02'), zone: 'Zone B', reason: 'Sin Estacionamiento' },
      ],
      isLoading: false,
    } as any)
    render(<FinesManagement />)
    expect(screen.getByText('ABC 123')).toBeDefined()
    expect(screen.getByText('DEF 456')).toBeDefined()
  })

  it('should show loading state', () => {
    vi.mocked(useAllFines).mockReturnValue({
      data: [],
      isLoading: true,
    } as any)
    const { container } = render(<FinesManagement />)
    const pulseDivs = container.querySelectorAll('.animate-pulse')
    expect(pulseDivs.length).toBeGreaterThan(0)
  })
})
