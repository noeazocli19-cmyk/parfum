// Prix formaté ou "Prix sur demande" (aucun prix inventé).

'use client'

import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/format'

export function PriceText({
  price,
  className,
  undeterminedClassName,
}: {
  price: number | null | undefined
  className?: string
  undeterminedClassName?: string
}) {
  const formatted = formatPrice(price)
  if (formatted === null) {
    return (
      <span
        className={cn(
          'text-sm italic text-muted-foreground',
          undeterminedClassName
        )}
      >
        Prix sur demande
      </span>
    )
  }
  return <span className={cn('font-medium', className)}>{formatted}</span>
}
