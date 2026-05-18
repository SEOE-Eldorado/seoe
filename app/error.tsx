'use client'
 
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { Button } from '@shared/ui/atoms/button'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error)
  }, [error])
 
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background">
      <div className="p-8 bg-card rounded-xl border shadow-sm max-w-md">
        <div className="mb-4 flex justify-center">
            <span className="material-symbols-outlined text-6xl text-destructive">error</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">¡Ups! Algo salió mal</h2>
        <p className="text-muted-foreground mb-6">
          Ha ocurrido un error inesperado. Hemos sido notificados y estamos trabajando en ello.
        </p>
        <div className="flex flex-col gap-2">
            <Button
                onClick={() => reset()}
                className="w-full"
            >
                Reintentar
            </Button>
            <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full"
            >
                Ir al inicio
            </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-muted rounded-md text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-destructive">{error.message}</p>
                <p className="text-xs font-mono mt-2 text-muted-foreground">{error.stack}</p>
            </div>
        )}
      </div>
    </div>
  )
}
