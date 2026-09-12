// Carte produit élégante — utilisée sur l'accueil, la boutique et les suggestions.

'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/lib/types'
import { CATEGORY_LABELS_SHORT } from '@/lib/format'
import { useCart } from '@/store/cart'
import { PriceText } from '@/components/shared/price-text'
import { SampleBadge } from '@/components/shared/sample-badge'
import { cn } from '@/lib/utils'

export function ProductCard({
  product,
  index = 0,
}: {
  product: Product
  index?: number
}) {
  const addItem = useCart((state) => state.addItem)
  const image = product.images?.[0]?.url ?? null

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.5,
        ease: 'easeOut',
        delay: Math.min(index * 0.07, 0.35),
      }}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(11,61,46,0.25)]"
    >
      <a
        href={`#/parfum/${encodeURIComponent(product.slug)}`}
        className="relative block aspect-[4/5] overflow-hidden bg-cream"
        aria-label={`Voir le parfum ${product.name}`}
      >
        {image ? (
          <Image
            src={image}
            alt={product.images?.[0]?.alt || `Flacon du parfum ${product.name}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-5xl text-forest/15">BO</span>
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.isSample ? <SampleBadge /> : null}
        </div>
        {!product.isAvailable ? (
          <div className="absolute inset-0 flex items-end bg-white/45 p-3">
            <span className="rounded-full bg-[#171717]/80 px-3 py-1 text-xs font-medium text-white">
              Indisponible
            </span>
          </div>
        ) : null}
      </a>

      <div className="flex flex-1 flex-col gap-1.5 p-4 sm:p-5">
        <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold-deep">
          {CATEGORY_LABELS_SHORT[product.category]}
        </span>
        <a
          href={`#/parfum/${encodeURIComponent(product.slug)}`}
          className="font-display text-xl font-semibold leading-snug text-ink transition-colors hover:text-forest"
        >
          {product.name}
        </a>
        <div className="mt-auto flex items-center justify-between pt-3">
          <PriceText
            price={product.price}
            className="text-[15px] text-forest"
          />
          <div className="flex items-center gap-1.5">
            <a
              href={`#/parfum/${encodeURIComponent(product.slug)}`}
              className="rounded-full border border-forest/20 px-3.5 py-1.5 text-xs font-medium text-forest transition-colors hover:border-forest hover:bg-forest-deep hover:text-white"
            >
              Voir
            </a>
            <button
              type="button"
              onClick={() => {
                addItem(product)
                toast.success(`${product.name} ajouté au panier`, {
                  description: 'Rendez-vous dans votre panier pour commander.',
                })
              }}
              disabled={!product.isAvailable}
              aria-label={`Ajouter ${product.name} au panier`}
              className={cn(
                'flex size-9 items-center justify-center rounded-full bg-forest-deep text-white transition-all hover:bg-pine-deep active:scale-90',
                !product.isAvailable && 'cursor-not-allowed bg-stone-300'
              )}
            >
              <ShoppingBag className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
