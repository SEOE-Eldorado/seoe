import { ReactNode } from "react"

interface Location {
    latitude: number
    longitude: number
    address?: string
}

interface LocationMapProps {
    location: Location | null
    className?: string
    children?: ReactNode
}

export function LocationMap({ location, className = "", children }: LocationMapProps) {
    return (
        <div className={`relative overflow-hidden bg-muted ${className}`}>
            {/* Map Background - Dynamic Google Maps Static API or similar could be used here */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                style={{
                    backgroundImage: location
                        ? `url("https://maps.googleapis.com/maps/api/staticmap?center=${location.latitude},${location.longitude}&zoom=15&size=600x400&maptype=roadmap&markers=color:red%7C${location.latitude},${location.longitude}&key=YOUR_API_KEY_IF_AVAILABLE")`
                        : 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC0oBufrDQG-A7v5osV6Xcx5WuFyFwh1ZW6okHVrASSw2rPngBG2JfnR7EJdEE_tzI1YCnvKmK8nwaavRvoTzE-rEMroiWQVplfoqYU6dDyXXpZTKBT6PpkICIC-Ub80_J92Pb_5HYY5k7m1HJhBvS0dTSp10ntEtgFVvJmLLQuRIKOpcZF5621J3B2jwzMshETMTf0VmLAsxW8uaLraEkt9qmagLhvPQKpfmjT4FghWH9wJWuJ5qonVsCB2vJ0mRpkzKZw1Zi--HA")',
                }}
            >
                {/* Overlay to ensure text readability if map image fails or acts as placeholder */}
                {!location && <div className="absolute inset-0 bg-black/20"></div>}
            </div>

            {/* If we don't use a real static map API, we can keep the fancy styling but just update text */}
            {!location && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/10 backdrop-blur-sm">
                    <p className="text-xs font-medium text-foreground bg-background/80 px-3 py-1 rounded-full">
                        Habilita la ubicación
                    </p>
                </div>
            )}

            {/* Embed iframe map for better experience without API key? */}
            {location && (
                <iframe
                    width="100%"
                    height="100%"
                    className="pointer-events-none"
                    style={{ border: 0, position: 'absolute', inset: 0, opacity: 0.8 }}
                    allowFullScreen
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.01}%2C${location.latitude - 0.01}%2C${location.longitude + 0.01}%2C${location.latitude + 0.01}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`}
                ></iframe>
            )}
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/60 pointer-events-none"></div>

            {/* Radar/Location Pulse Animation for Home Page style - maybe this should be optional or child? 
                The prompt says "use the same component", so I should probably keep the core visual elements.
                However, start-parking-page has its own "Center Pin Indicator".
                If I include the pulse here, it might conflict visually with the pin in StartParking.
                
                The pulse in NewDashboard represents the user's location.
                In StartParking, we also show user location, but often we want to show the specific selection.
                
                Let's include the pulse but maybe allow it to be hidden?
                Or maybe StartParking can just use the pulse too? 
                Actually StartParking displays a large pin in the center of the screen.
                
                I'll leave the pulse here as it replaces the "markers=color:red" comment logic which is static.
            */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                <div className="h-16 w-16 animate-ping rounded-full bg-primary/30 opacity-75"></div>
                <div className="absolute h-4 w-4 rounded-full bg-primary ring-4 ring-white shadow-lg"></div>
            </div>

            {/* Children (overlays) */}
            {children}
        </div>
    )
}
