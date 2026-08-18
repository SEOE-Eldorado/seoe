import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ZoneManagement } from '../zone-management'
import { useSettings } from '@entities/settings-context'

// Mock settings context
vi.mock('@entities/settings-context', () => ({
  useSettings: vi.fn(),
}))

// Mock UI components
vi.mock('@shared/ui/atoms/button', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="button">
      {children}
    </button>
  ),
}))

vi.mock('@shared/ui/atoms/input', () => ({
  Input: ({ value, onChange, placeholder }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      data-testid="input"
    />
  ),
}))

vi.mock('@shared/ui/atoms/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}))

vi.mock('@shared/ui/atoms/label', () => ({
  Label: ({ children }: any) => <label>{children}</label>,
}))

vi.mock('@shared/ui/atoms/switch', () => ({
  Switch: ({ checked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      data-testid="switch"
    />
  ),
}))

vi.mock('@widgets/location-map', () => ({
  LocationMap: () => <div data-testid="location-map">Map</div>,
}))

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react') as any
  return {
    ...actual,
    MapPin: 'map-pin',
    Plus: 'plus',
    Trash2: 'trash-2',
    Edit2: 'edit-2',
    Search: 'search',
    Map: 'map',
    Layers: 'layers',
    Navigation: 'navigation',
    Target: 'target',
    Compass: 'compass',
    Settings2: 'settings-2',
    Check: 'check',
    MapPinOff: 'map-pin-off',
    Maximize2: 'maximize-2',
    ArrowLeft: 'arrow-left',
  }
})

describe('ZoneManagement (Admin Widget)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useSettings).mockReturnValue({
      settings: null,
      zones: [
        { id: 'zone-1', name: 'Microcentro', description: 'Área central', active: true, center: { lat: -34.6037, lng: -58.3816 }, radius: 500 },
        { id: 'zone-2', name: 'Palermo', description: 'Zona norte', active: false, center: { lat: -34.58, lng: -58.42 }, radius: 800 },
      ],
      specialDays: [],
      updateSettings: vi.fn(),
      addZone: vi.fn(),
      updateZone: vi.fn(),
      deleteZone: vi.fn(),
      isOperatingTime: vi.fn(() => true),
      isLocationInAnyZone: vi.fn(() => false),
      getZoneAtLocation: vi.fn(() => null),
      calculateCost: vi.fn(() => 0),
      loading: false,
    })
  })

  it('should render without crashing', () => {
    const { container } = render(<ZoneManagement />)
    expect(container).toBeDefined()
  })

  it('should display the management header', () => {
    render(<ZoneManagement />)
    expect(screen.getByText('Zonas de Control')).toBeDefined()
  })

  it('should display the search input', () => {
    render(<ZoneManagement />)
    expect(screen.getByPlaceholderText(/Buscar por nombre/)).toBeDefined()
  })

  it('should list all zones', () => {
    render(<ZoneManagement />)
    expect(screen.getByText('Microcentro')).toBeDefined()
    expect(screen.getByText('Palermo')).toBeDefined()
  })

  it('should display "Nueva Zona" button', () => {
    render(<ZoneManagement />)
    const buttons = screen.getAllByText('Nueva Zona')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('should filter zones by search term', () => {
    render(<ZoneManagement />)
    const input = screen.getByPlaceholderText(/Buscar por nombre/)
    fireEvent.change(input, { target: { value: 'Micro' } })
    expect(screen.getByText('Microcentro')).toBeDefined()
    expect(screen.queryByText('Palermo')).toBeNull()
  })

  it('should show empty state when no zones match', () => {
    render(<ZoneManagement />)
    const input = screen.getByPlaceholderText(/Buscar por nombre/)
    fireEvent.change(input, { target: { value: 'NonExistentZone' } })
    expect(screen.getByText('No se encontraron zonas de control')).toBeDefined()
  })
})
