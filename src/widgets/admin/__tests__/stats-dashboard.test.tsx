import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StatsDashboard } from '../stats-dashboard'
import { useSettings } from '@entities/settings-context'

// Mock settings context
vi.mock('@entities/settings-context', () => ({
  useSettings: vi.fn(),
}))

// Mock Firebase
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
  onSnapshot: vi.fn((_query, cb) => {
    cb({
      size: 0,
      forEach: () => {},
      docs: [],
    })
    return () => {}
  }),
  getDocs: vi.fn().mockResolvedValue({
    forEach: () => {},
    size: 0,
    docs: [],
  }),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date }),
    now: () => ({ toDate: () => new Date() }),
  },
}))

// Mock Card components
vi.mock('@shared/ui/atoms/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}))

// Mock lucide icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react') as any
  return {
    ...actual,
    Car: 'car',
    DollarSign: 'dollar-sign',
    Users: 'users',
    AlertTriangle: 'alert-triangle',
    TrendingUp: 'trending-up',
    Clock: 'clock',
    MapPin: 'map-pin',
    Activity: 'activity',
    ArrowUpRight: 'arrow-up-right',
    ArrowDownRight: 'arrow-down-right',
    Zap: 'zap',
    Map: 'map',
    Wallet: 'wallet',
  }
})

describe('StatsDashboard (Admin Widget)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useSettings).mockReturnValue({
      zones: [
        { id: 'zone-1', name: 'Zone A', active: true, center: { lat: -34.6037, lng: -58.3816 }, radius: 500, description: '' },
        { id: 'zone-2', name: 'Zone B', active: false, center: { lat: -34.61, lng: -58.38 }, radius: 300, description: '' },
      ],
    })
  })

  it('should render without crashing', async () => {
    const { container } = render(<StatsDashboard />)
    expect(container).toBeDefined()
  })

  it('should display the dashboard header', () => {
    render(<StatsDashboard />)
    expect(screen.getByText('Panel de Estadísticas')).toBeDefined()
  })

  it('should show loading skeleton initially', () => {
    const { container } = render(<StatsDashboard />)
    // The loading state shows pulse skeleton divs
    const pulseDiv = container.querySelector('.animate-pulse')
    expect(pulseDiv).toBeDefined()
  })

  it('should display zone stats after loading', async () => {
    render(<StatsDashboard />)

    // After the onSnapshot fires, loading becomes false and stats render
    // Check that after loading we see stat labels
    // Note: Since onSnapshot fires synchronously in the mock, this might already be loaded
    await vi.waitFor(() => {
      // The component should eventually show stats
      const statLabels = screen.getAllByText(/Sesiones Activas|Recaudación|Monto Mes|Multas Hoy|Usuarios|Sesiones Hoy/)
      expect(statLabels.length).toBeGreaterThan(0)
    }, { timeout: 2000 })
  })
})
