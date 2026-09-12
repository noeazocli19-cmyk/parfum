// Indicateur de chargement discret.

'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Spinner({
  label = 'Chargement…',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-6 animate-spin text-forest/60" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
