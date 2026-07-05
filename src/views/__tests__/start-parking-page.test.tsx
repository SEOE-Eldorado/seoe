import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StartParkingPage } from '../start-parking-page'
import { useVehicles } from '@entities/vehicles-context'
import { useParking } from '@entities/parking-context'
import { useAuth } from '@entities/auth-context'
import { useSettings } from '@entities/settings-context'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: vi.fn(),
  }),
}))

// Mock all context dependencies
vi.mock('@entities/vehicles-context', () => ({
  useVehicles: vi.fn(),
}))

vi.mock('@entities/parking-context', () => ({
  useParking: vi.fn(),
}))

vi.mock('@entities/auth-context', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@entities/settings-context', () => ({
  useSettings: vi.fn(),
}))

// Mock widgets
vi.mock('@widgets/location-map', () => ({
  LocationMap: () => <div data-testid="location-map">Map</div>,
}))

// Mock shadcn sheet
vi.mock('@shared/ui/atoms/sheet', () => ({
  Sheet: ({ children }: any) => <div data-testid="sheet">{children}</div>,
  SheetContent: ({ children }: any) => <div data-testid="sheet-content">{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
}))

// Mock alerts
vi.mock('@shared/ui/atoms/alert', () => ({
  Alert: ({ children }: any) => <div>{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
  AlertTitle: ({ children }: any) => <div>{children}</div>,
}))

// Mock lucide icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react') as any
  return {
    ...actual,
    ChevronLeft: 'chevron-left',
    ChevronRight: 'chevron-right',
    Car: 'car',
    MapPin: 'map-pin',
    AlertCircle: 'alert-circle',
    CheckCircle2: 'check-circle-2',
  }
})

// Mock tanstack/react-query for the exemption query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: null,
      isLoading: false,
    })),
  }
})

describe('StartParkingPage', () => {
  const onSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useVehicles).mockReturnValue({
      vehicles: [{ id: 'veh-1', licensePlate: 'ABC 123', brand: 'Toyota', model: 'Corolla', isDefault: true }],
      getDefaultVehicle: () => ({ id: 'veh-1', licensePlate: 'ABC 123', brand: 'Toyota', model: 'Corolla', isDefault: true }),
    } as any)

    vi.mocked(useParking).mockReturnValue({
      startParking: vi.fn(),
    } as any)

    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'test-user', balance: 100 },
    } as any)

    vi.mocked(useSettings).mockReturnValue({
      settings: {
        rates: { tier1: 50, tier2: 85, tier3: 130 },
        operatingHours: { morning: { start: '08:00', end: '12:00' }, afternoon: { start: '16:00', end: '20:00' } },
        operatingDays: [1, 2, 3, 4, 5, 6],
      },
      isOperatingTime: () => true,
      isLocationInAnyZone: () => true,
      getZoneAtLocation: () => ({ id: 'zone-1', name: 'Zone A', description: '', active: true, center: { lat: -34.6037, lng: -58.3816 }, radius: 500 }),
      calculateCost: () => 100,
    } as any)
  })

  it('should render without crashing', () => {
    const { container } = render(<StartParkingPage onSuccess={onSuccess} />)
    expect(container).toBeDefined()
  })

  it('should render the vehicle plate', () => {
    render(<StartParkingPage onSuccess={onSuccess} />)
    const plates = screen.getAllByText('ABC 123')
    expect(plates.length).toBeGreaterThanOrEqual(1)
  })

  it('should render the start parking button', () => {
    render(<StartParkingPage onSuccess={onSuccess} />)
    expect(screen.getByText('Iniciar Estacionamiento')).toBeDefined()
  })

  it('should render the location map', () => {
    render(<StartParkingPage onSuccess={onSuccess} />)
    expect(screen.getByTestId('location-map')).toBeDefined()
  })
})
