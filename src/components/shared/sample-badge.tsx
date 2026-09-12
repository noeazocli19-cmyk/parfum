// Badge identifiant les données d'exemple temporaires (produits de démonstration).

'use client'

import { cn } from '@/lib/utils'

export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      title="Produit d'exemple — à remplacer depuis le tableau de bord"
      className={cn(
        'inline-flex items-center rounded-full border border-gold/50 bg-gold/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-gold-deep',
        className
      )}
    >
      Exemple
    </span>
  )
}
