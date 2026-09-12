// Sélecteur de quantité accessible (produit, panier).

'use client'

import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  size = 'md',
  ariaLabel = 'Quantité',
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
  size?: 'sm' | 'md'
  ariaLabel?: string
}) {
  const btn =
    size === 'sm'
      ? 'size-8'
      : 'size-10'
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-border bg-white',
        disabled && 'opacity-50'
      )}
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={cn(
          'flex items-center justify-center rounded-full text-forest transition-colors hover:bg-forest/5 disabled:cursor-not-allowed disabled:opacity-40',
          btn
        )}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label="Diminuer la quantité"
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <span
        className={cn(
          'min-w-8 text-center text-sm font-medium tabular-nums',
          size === 'sm' && 'min-w-6'
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        className={cn(
          'flex items-center justify-center rounded-full text-forest transition-colors hover:bg-forest/5 disabled:cursor-not-allowed disabled:opacity-40',
          btn
        )}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label="Augmenter la quantité"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
