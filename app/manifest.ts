import { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  const isInspector = process.env.NEXT_PUBLIC_APP_ENV === 'inspector'

  return {
    name: isInspector ? 'SEOE Inspector' : 'SEOE Wallet',
    short_name: isInspector ? 'Fiscalización' : 'Billetera',
    description: isInspector ? 'Plataforma oficial de control de estacionamiento' : 'Billetera digital de estacionamiento - SEOE',
    start_url: '/',
    display: 'standalone',
    background_color: isInspector ? '#f8fafc' : '#0D2742',
    theme_color: isInspector ? '#10b981' : '#0D2742',
    icons: [
      {
        src: '/logo-seoe.png',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
  }
}
