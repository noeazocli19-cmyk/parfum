// Boutique — filtres catégorie / recherche / disponibilité / tri, grille + « voir plus ».

'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, SearchX } from 'lucide-react'
import type { Category, Route } from '@/lib/types'
import { api } from '@/lib/api-client'
import { buildHash } from '@/hooks/use-hash-route'
import { cn } from '@/lib/utils'
import { ProductCard } from '@/components/shared/product-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type TriOption = 'recent' | 'prix_asc' | 'prix_desc'

const PAGE_SIZE = 12

const CATEGORY_CHIPS: { value: Category | undefined; label: string }[] = [
  { value: undefined, label: 'Tous' },
  { value: 'HOMME', label: 'Homme' },
  { value: 'FEMME', label: 'Femme' },
  { value: 'MIXTE', label: 'Mixte' },
]

function isCategory(value: string | undefined): value is Category {
  return value === 'HOMME' || value === 'FEMME' || value === 'MIXTE'
}

function isTri(value: string | undefined): value is TriOption {
  return value === 'recent' || value === 'prix_asc' || value === 'prix_desc'
}

function chipClasses(active: boolean): string {
  return cn(
    'inline-flex items-center rounded-full border px-4 py-2 text-sm transition-colors',
    active
      ? 'border-forest bg-forest-deep text-white'
      : 'border-border bg-white text-ink/70 hover:border-forest/40 hover:text-forest'
  )
}

export function ShopView({
  route,
  navigate,
}: {
  route: Route
  navigate: (to: string, options?: { replace?: boolean }) => void
}) {
  const categorie = isCategory(route.query.categorie) ? route.query.categorie : undefined
  const recherche = route.query.recherche ?? ''
  const dispo = route.query.dispo === 'true'
  const tri: TriOption = isTri(route.query.tri) ? route.query.tri : 'recent'

  const [searchInput, setSearchInput] = useState(recherche)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Synchronise le champ et réinitialise la pagination quand les filtres
  // changent (ajustement pendant le rendu, back/avant, lien externe).
  const filtersKey = `${categorie}|${recherche}|${dispo}|${tri}`
  const [lastFiltersKey, setLastFiltersKey] = useState(filtersKey)
  if (lastFiltersKey !== filtersKey) {
    setLastFiltersKey(filtersKey)
    setSearchInput(recherche)
    setVisible(PAGE_SIZE)
  }
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    },
    []
  )

  // Met à jour l'URL (replace) avec les filtres courants.
  const goTo = (patch: {
    categorie?: Category | undefined
    recherche?: string
    dispo?: boolean
    tri?: TriOption
  }) => {
    const nextCategorie = patch.categorie !== undefined ? patch.categorie : categorie
    const nextRecherche = patch.recherche !== undefined ? patch.recherche : recherche
    const nextDispo = patch.dispo !== undefined ? patch.dispo : dispo
    const nextTri = patch.tri !== undefined ? patch.tri : tri
    navigate(
      buildHash('boutique', {
        categorie: nextCategorie,
        recherche: nextRecherche || undefined,
        dispo: nextDispo ? 'true' : undefined,
        tri: nextTri !== 'recent' ? nextTri : undefined,
      }),
      { replace: true }
    )
  }

  // Recherche debouncée (300 ms).
  const onSearchChange = (value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => goTo({ recherche: value }), 300)
  }

  const query = useQuery({
    queryKey: ['products', 'boutique', { categorie, recherche, dispo, tri }],
    queryFn: () =>
      api.getProducts({
        categorie,
        recherche: recherche || undefined,
        disponible: dispo,
        tri,
      }),
  })

  const products = query.data?.products ?? []
  const total = query.data?.total ?? 0
  const visibleProducts = products.slice(0, visible)

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold-deep">
          La boutique
        </span>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold text-forest sm:text-4xl lg:text-5xl">
            Tous nos parfums
          </h1>
          {query.data ? (
            <p className="pb-1 text-sm text-muted-foreground">
              {total} parfum{total > 1 ? 's' : ''}
            </p>
          ) : null}
        </div>
      </section>

      {/* Barre de filtres collante sous la navigation */}
      <div className="sticky top-16 z-30 border-b border-border/70 bg-white/95 backdrop-blur-md lg:top-20">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2.5 px-4 py-3 sm:px-6 lg:px-8">
          {CATEGORY_CHIPS.map((chip) => {
            const active = chip.value === categorie
            return (
              <a
                key={chip.label}
                href={buildHash('boutique', {
                  categorie: chip.value,
                  recherche: recherche || undefined,
                  dispo: dispo ? 'true' : undefined,
                  tri: tri !== 'recent' ? tri : undefined,
                })}
                aria-current={active ? 'true' : undefined}
                className={chipClasses(active)}
              >
                {chip.label}
              </a>
            )
          })}

          <button
            type="button"
            onClick={() => goTo({ dispo: !dispo })}
            aria-pressed={dispo}
            className={chipClasses(dispo)}
          >
            Disponibles uniquement
          </button>

          <label className="relative ms-auto w-full sm:w-56">
            <span className="sr-only">Rechercher un parfum</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={searchInput}
              onChange={(event) => onSearchChange(event.target.value)}
              type="search"
              placeholder="Rechercher…"
              className="h-10 w-full rounded-full border border-input bg-white pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-gold"
            />
          </label>

          <Select value={tri} onValueChange={(value) => goTo({ tri: value as TriOption })}>
            <SelectTrigger
              aria-label="Trier les parfums"
              className="h-10 w-[176px] rounded-full bg-white px-4"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Nouveautés</SelectItem>
              <SelectItem value="prix_asc">Prix croissant</SelectItem>
              <SelectItem value="prix_desc">Prix décroissant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {query.isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-xl border border-border/70">
                <div className="aspect-[4/5] animate-pulse bg-cream" />
                <div className="space-y-2.5 p-4 sm:p-5">
                  <div className="h-3 w-16 animate-pulse rounded bg-cream" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-cream" />
                  <div className="h-8 w-full animate-pulse rounded bg-cream" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Aucun parfum ne correspond à votre recherche"
            description="Essayez d’élargir vos critères ou réinitialisez les filtres."
            action={
              <Button
                className="bg-forest-deep hover:bg-pine-deep"
                onClick={() => navigate('#/boutique')}
              >
                Réinitialiser les filtres
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index % PAGE_SIZE} />
              ))}
            </div>
            {products.length > visible ? (
              <div className="mt-10 flex justify-center">
                <Button
                  variant="outline"
                  className="border-forest/30 bg-transparent px-8 text-forest hover:border-forest hover:bg-cream"
                  onClick={() => setVisible((value) => value + PAGE_SIZE)}
                >
                  Voir plus de parfums
                </Button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </>
  )
}
