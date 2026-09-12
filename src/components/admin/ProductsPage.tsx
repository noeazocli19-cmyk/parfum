// Gestion du catalogue : liste, filtres, disponibilité, vedette, suppression.

'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Image from 'next/image'
import { Package, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react'
import { adminApi, api } from '@/lib/api-client'
import { CATEGORY_LABELS_SHORT, primaryImage } from '@/lib/format'
import { CATEGORIES, type Category, type Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { PriceText } from '@/components/shared/price-text'
import { Spinner } from '@/components/shared/spinner'
import {
  handleMutationError,
  useAdminQuery,
  type NavigateFn,
} from './admin-hooks'
import { AdminPageHeader, ConfirmDialog } from './admin-ui'

type CategoryFilter = Category | 'ALL'
type AvailabilityFilter = 'ALL' | 'AVAILABLE' | 'UNAVAILABLE'
type SortOption = 'recent' | 'price_asc' | 'price_desc'

function ProductThumb({ product }: { product: Product }) {
  const url = primaryImage(product)
  if (!url) {
    return (
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-cream">
        <Package className="size-5 text-forest/40" aria-hidden="true" />
      </div>
    )
  }
  return (
    <Image
      src={url}
      alt={product.name}
      width={48}
      height={48}
      className="size-12 shrink-0 rounded-lg border object-cover"
    />
  )
}

export function ProductsPage({ navigate }: { navigate: NavigateFn }) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('ALL')
  const [availability, setAvailability] = useState<AvailabilityFilter>('ALL')
  const [sort, setSort] = useState<SortOption>('recent')

  const productsQuery = useAdminQuery({
    queryKey: ['admin-products'],
    queryFn: () => api.getProducts(),
    navigate,
  })
  const products = productsQuery.data?.products ?? []

  const patchMutation = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string
      patch: { isAvailable?: boolean; isFeatured?: boolean }
    }) => adminApi.patchProduct(id, patch),
    onSuccess: (_data, variables) => {
      toast.success(
        variables.patch.isAvailable !== undefined
          ? 'Disponibilité mise à jour'
          : 'Vedette mise à jour'
      )
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: (error) => handleMutationError(error, navigate),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      toast.success('Parfum supprimé')
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: (error) => handleMutationError(error, navigate),
  })

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    let list = [...products]
    if (query) {
      list = list.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.slug.toLowerCase().includes(query)
      )
    }
    if (category !== 'ALL') list = list.filter((p) => p.category === category)
    if (availability === 'AVAILABLE') list = list.filter((p) => p.isAvailable)
    if (availability === 'UNAVAILABLE') list = list.filter((p) => !p.isAvailable)
    switch (sort) {
      case 'price_asc':
        list.sort(
          (a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY)
        )
        break
      case 'price_desc':
        list.sort(
          (a, b) => (b.price ?? Number.NEGATIVE_INFINITY) - (a.price ?? Number.NEGATIVE_INFINITY)
        )
        break
      default:
        list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
    }
    return list
  }, [products, search, category, availability, sort])

  const isLoading = productsQuery.isPending

  const deleteDialog = (product: Product) => (
    <ConfirmDialog
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          aria-label={`Supprimer ${product.name}`}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      }
      title="Supprimer ce parfum ?"
      description="Cette action est définitive. Le parfum sera retiré de la boutique."
      confirmLabel="Supprimer définitivement"
      onConfirm={() => deleteMutation.mutate(product.id)}
    />
  )

  return (
    <div>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Produits"
        description="Créez, modifiez et organisez les parfums de la boutique."
        actions={
          <Button asChild>
            <a href="#/admin/produits/nouveau">
              <Plus className="size-4" aria-hidden="true" />
              Nouveau parfum
            </a>
          </Button>
        }
      />

      {/* Barre de filtres */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 sm:min-w-[220px]">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un parfum…"
            className="pl-9"
            aria-label="Rechercher un parfum"
          />
        </div>
        <Select
          value={category}
          onValueChange={(value) => setCategory(value as CategoryFilter)}
        >
          <SelectTrigger className="w-full sm:w-[160px]" aria-label="Filtrer par catégorie">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toutes</SelectItem>
            {CATEGORIES.map((item) => (
              <SelectItem key={item} value={item}>
                {CATEGORY_LABELS_SHORT[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={availability}
          onValueChange={(value) => setAvailability(value as AvailabilityFilter)}
        >
          <SelectTrigger className="w-full sm:w-[150px]" aria-label="Filtrer par disponibilité">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous</SelectItem>
            <SelectItem value="AVAILABLE">Disponibles</SelectItem>
            <SelectItem value="UNAVAILABLE">Indisponibles</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
          <SelectTrigger className="w-full sm:w-[170px]" aria-label="Trier les parfums">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Plus récents</SelectItem>
            <SelectItem value="price_asc">Prix croissant</SelectItem>
            <SelectItem value="price_desc">Prix décroissant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!isLoading ? (
        <p className="mb-3 text-sm text-muted-foreground">
          {filtered.length} parfum{filtered.length > 1 ? 's' : ''}
        </p>
      ) : null}

      {isLoading ? (
        <Spinner label="Chargement du catalogue…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={products.length === 0 ? 'Aucun parfum' : 'Aucun résultat'}
          description={
            products.length === 0
              ? 'Ajoutez votre premier parfum pour lancer la boutique.'
              : 'Modifiez la recherche ou les filtres pour afficher plus de parfums.'
          }
          action={
            products.length === 0 ? (
              <Button asChild>
                <a href="#/admin/produits/nouveau">
                  <Plus className="size-4" aria-hidden="true" />
                  Créer un parfum
                </a>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Vue tableau (desktop) */}
          <div className="hidden rounded-xl border bg-white md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parfum</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Disponible</TableHead>
                  <TableHead>Vedette</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ProductThumb product={product} />
                        <div className="min-w-0">
                          <a
                            href={`#/admin/produits/${product.id}`}
                            className="font-medium text-forest hover:underline"
                          >
                            {product.name}
                          </a>
                          <p className="truncate text-xs text-muted-foreground">
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {CATEGORY_LABELS_SHORT[product.category]}
                    </TableCell>
                    <TableCell>
                      <PriceText price={product.price} />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={product.isAvailable}
                        onCheckedChange={(checked) =>
                          patchMutation.mutate({
                            id: product.id,
                            patch: { isAvailable: checked },
                          })
                        }
                        disabled={patchMutation.isPending}
                        aria-label={`Disponibilité de ${product.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          patchMutation.mutate({
                            id: product.id,
                            patch: { isFeatured: !product.isFeatured },
                          })
                        }
                        disabled={patchMutation.isPending}
                        aria-label={
                          product.isFeatured
                            ? `Retirer ${product.name} des incontournables`
                            : `Afficher ${product.name} dans les incontournables`
                        }
                        aria-pressed={product.isFeatured}
                      >
                        <Star
                          className={
                            product.isFeatured
                              ? 'size-4 fill-gold text-gold'
                              : 'size-4 text-muted-foreground'
                          }
                          aria-hidden="true"
                        />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          aria-label={`Modifier ${product.name}`}
                        >
                          <a href={`#/admin/produits/${product.id}`}>
                            <Pencil className="size-4" aria-hidden="true" />
                          </a>
                        </Button>
                        {deleteDialog(product)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Vue cartes (mobile) */}
          <div className="space-y-3 md:hidden">
            {filtered.map((product) => (
              <div key={product.id} className="rounded-xl border bg-white p-4">
                <div className="flex items-start gap-3">
                  <ProductThumb product={product} />
                  <div className="min-w-0 flex-1">
                    <a
                      href={`#/admin/produits/${product.id}`}
                      className="font-medium text-forest hover:underline"
                    >
                      {product.name}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS_SHORT[product.category]}
                    </p>
                    <div className="mt-1">
                      <PriceText price={product.price} />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        patchMutation.mutate({
                          id: product.id,
                          patch: { isFeatured: !product.isFeatured },
                        })
                      }
                      aria-label={
                        product.isFeatured
                          ? `Retirer ${product.name} des incontournables`
                          : `Afficher ${product.name} dans les incontournables`
                      }
                      aria-pressed={product.isFeatured}
                    >
                      <Star
                        className={
                          product.isFeatured
                            ? 'size-4 fill-gold text-gold'
                            : 'size-4 text-muted-foreground'
                        }
                        aria-hidden="true"
                      />
                    </Button>
                    <Button variant="ghost" size="icon" asChild aria-label={`Modifier ${product.name}`}>
                      <a href={`#/admin/produits/${product.id}`}>
                        <Pencil className="size-4" aria-hidden="true" />
                      </a>
                    </Button>
                    {deleteDialog(product)}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <span className="text-sm text-muted-foreground">Disponible</span>
                  <Switch
                    checked={product.isAvailable}
                    onCheckedChange={(checked) =>
                      patchMutation.mutate({
                        id: product.id,
                        patch: { isAvailable: checked },
                      })
                    }
                    disabled={patchMutation.isPending}
                    aria-label={`Disponibilité de ${product.name}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
