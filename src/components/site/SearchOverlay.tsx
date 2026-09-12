// Overlay de recherche plein écran — résultats en direct, fermeture Esc / fond / croix.

'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { api } from '@/lib/api-client'
import { buildHash } from '@/hooks/use-hash-route'
import { CATEGORY_LABELS_SHORT, primaryImage } from '@/lib/format'
import { PriceText } from '@/components/shared/price-text'
import { Spinner } from '@/components/shared/spinner'

export function SearchOverlay({
  open,
  onOpenChange,
  navigate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  navigate: (to: string, options?: { replace?: boolean }) => void
}) {
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')

  // Debounce de la saisie (250 ms).
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 250)
    return () => clearTimeout(timer)
  }, [term])

  // Champ réinitialisé à chaque ouverture (ajustement pendant le rendu).
  const [wasOpen, setWasOpen] = useState(false)
  if (wasOpen !== open) {
    setWasOpen(open)
    if (open) {
      setTerm('')
      setDebounced('')
    }
  }

  // Esc ferme, défilement du corps bloqué tant que l'overlay est ouvert.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onOpenChange])

  const query = useQuery({
    queryKey: ['products', 'recherche', debounced],
    queryFn: () => api.getProducts({ recherche: debounced }),
    enabled: open && debounced.length >= 2,
  })

  const products = query.data?.products.slice(0, 6) ?? []
  const searching = debounced.length >= 2

  const submit = () => {
    const value = term.trim()
    onOpenChange(false)
    navigate(buildHash('boutique', { recherche: value || undefined }))
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed inset-0 z-50 overflow-y-auto bg-white/95 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Recherche de parfums"
          onClick={(event) => {
            if (event.target === event.currentTarget) onOpenChange(false)
          }}
        >
          <div className="mx-auto max-w-2xl px-4 pb-16 pt-16 sm:pt-24">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-gold-deep">
                <span className="h-px w-8 bg-gold/60" aria-hidden="true" />
                Recherche
              </span>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Fermer la recherche"
                className="flex size-11 items-center justify-center rounded-full text-forest transition-colors hover:bg-forest/5"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault()
                submit()
              }}
              className="mt-4 flex items-center gap-3 border-b-2 border-gold pb-3"
            >
              <Search className="size-5 shrink-0 text-gold-deep" aria-hidden="true" />
              <input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                autoFocus
                type="search"
                placeholder="Rechercher un parfum…"
                aria-label="Rechercher un parfum"
                className="w-full bg-transparent font-display text-2xl text-forest outline-none placeholder:text-forest/35"
              />
            </form>

            <div className="mt-6">
              {!searching ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Saisissez au moins deux caractères pour lancer la recherche.
                </p>
              ) : query.isLoading ? (
                <Spinner label="Recherche en cours…" className="py-8" />
              ) : products.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aucun parfum trouvé pour cette recherche.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-border/70">
                  {products.map((product) => {
                    const image = primaryImage(product)
                    return (
                      <li key={product.id}>
                        <a
                          href={`#/parfum/${encodeURIComponent(product.slug)}`}
                          onClick={() => onOpenChange(false)}
                          className="flex items-center gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-cream/70"
                        >
                          <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-cream">
                            {image ? (
                              <Image
                                src={image}
                                alt={`Flacon du parfum ${product.name}`}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="flex h-full items-center justify-center font-display text-sm text-forest/30">
                                BO
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-display text-lg font-semibold leading-snug text-ink">
                              {product.name}
                            </span>
                            <span className="text-[11px] uppercase tracking-[0.2em] text-gold-deep">
                              {CATEGORY_LABELS_SHORT[product.category]}
                            </span>
                          </span>
                          <PriceText price={product.price} className="shrink-0 text-sm text-forest" />
                        </a>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
