// Badge de statut d'une commande.

'use client'

import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/lib/types'
import { ORDER_STATUS_CLASSES, ORDER_STATUS_LABELS } from '@/lib/format'

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium',
        ORDER_STATUS_CLASSES[status],
        className
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  )
}
