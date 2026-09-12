// Formulaire de création et d'édition d'un parfum (catalogue + images + zone danger).

'use client'

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Image from 'next/image'
import { Loader2, Star, Upload, X } from 'lucide-react'
import { adminApi, api, type ProductInputDTO } from '@/lib/api-client'
import { slugify } from '@/lib/format'
import { productInputSchema } from '@/lib/validations'
import { CATEGORIES, CATEGORY_LABELS, type Category } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/shared/spinner'
import {
  handleMutationError,
  isSupportedImage,
  MAX_UPLOAD_BYTES,
  useAdminQuery,
  type NavigateFn,
} from './admin-hooks'
import { AdminCard, AdminPageHeader, ConfirmDialog, FieldError, SubmitLabel } from './admin-ui'

interface FormImage {
  url: string
  alt: string
  isPrimary: boolean
}

const MAX_IMAGES = 8

export function ProductFormPage({
  productId,
  navigate,
}: {
  productId?: string
  navigate: NavigateFn
}) {
  const queryClient = useQueryClient()
  const isEdit = Boolean(productId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [category, setCategory] = useState<Category>('HOMME')
  const [priceOnDemand, setPriceOnDemand] = useState(false)
  const [priceInput, setPriceInput] = useState('')
  const [stockInput, setStockInput] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [images, setImages] = useState<FormImage[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Chargement du parfum existant (édition).
  const productQuery = useAdminQuery({
    queryKey: ['admin-product', productId ?? ''],
    queryFn: () => api.getProduct(productId ?? ''),
    navigate,
    enabled: Boolean(productId),
  })

  // Hydratation du formulaire à réception du parfum (ajustement pendant le rendu).
  const product = productQuery.data?.product
  const [hydratedProductId, setHydratedProductId] = useState<string | null>(null)
  if (product && hydratedProductId !== product.id) {
    setHydratedProductId(product.id)
    setName(product.name)
    setSlug(product.slug)
    setSlugTouched(product.slug !== slugify(product.name))
    setCategory(product.category)
    setPriceOnDemand(product.price === null)
    setPriceInput(product.price === null ? '' : String(product.price))
    setStockInput(product.stock === null ? '' : String(product.stock))
    setIsAvailable(product.isAvailable)
    setIsFeatured(product.isFeatured)
    setDescription(product.description)
    setNotes(product.notes ?? '')
    setImages(
      product.images.map((img) => ({
        url: img.url,
        alt: img.alt,
        isPrimary: img.isPrimary,
      }))
    )
  }

  // Slug auto-généré tant qu'il n'a pas été modifié manuellement.
  if (!slugTouched) {
    const autoSlug = slugify(name)
    if (slug !== autoSlug) setSlug(autoSlug)
  }

  const saveMutation = useMutation({
    mutationFn: (input: ProductInputDTO) => adminApi.saveProduct(input, productId),
    onSuccess: () => {
      toast.success(isEdit ? 'Parfum modifié' : 'Parfum créé')
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      if (productId) {
        void queryClient.invalidateQueries({ queryKey: ['admin-product', productId] })
      }
      navigate('#/admin/produits')
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
      navigate('#/admin/produits')
    },
    onError: (error) => handleMutationError(error, navigate),
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => adminApi.uploadImage(file),
    onSuccess: (data) => {
      setImages((prev) =>
        prev.length >= MAX_IMAGES
          ? prev
          : [...prev, { url: data.url, alt: '', isPrimary: prev.length === 0 }]
      )
      toast.success('Image ajoutée')
    },
    onError: (error) => handleMutationError(error, navigate),
  })

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!isSupportedImage(file)) {
      toast.error('Format non pris en charge. Utilisez JPG, PNG ou WebP.')
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error('Image trop volumineuse (5 Mo maximum).')
      return
    }
    uploadMutation.mutate(file)
  }

  function setPrimaryImage(index: number) {
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === index })))
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length > 0 && !next.some((img) => img.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true }
      }
      return next
    })
  }

  function updateAlt(index: number, alt: string) {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, alt } : img)))
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    const nextErrors: Record<string, string> = {}

    if (!priceOnDemand) {
      const raw = priceInput.trim().replace(',', '.')
      if (raw === '') {
        nextErrors.price = 'Indiquez un prix ou cochez « Prix sur demande ».'
      } else if (Number.isNaN(Number(raw))) {
        nextErrors.price = 'Prix invalide.'
      }
    }
    if (stockInput.trim() !== '' && !Number.isInteger(Number(stockInput))) {
      nextErrors.stock = 'Stock invalide : nombre entier attendu.'
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      toast.error('Veuillez corriger les champs signalés.')
      return
    }

    const parsed = productInputSchema.safeParse({
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      description: description.trim(),
      notes: notes.trim() ? notes.trim() : null,
      category,
      price:
        priceOnDemand || priceInput.trim() === ''
          ? null
          : Number(priceInput.trim().replace(',', '.')),
      stock: stockInput.trim() === '' ? null : Number(stockInput),
      isAvailable,
      isFeatured,
      images,
    })

    if (!parsed.success) {
      const map: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.')
        if (key && !map[key]) map[key] = issue.message
      }
      setErrors(map)
      toast.error('Veuillez corriger les champs signalés.')
      return
    }

    saveMutation.mutate(parsed.data)
  }

  if (isEdit && productQuery.isPending) {
    return <Spinner label="Chargement du parfum…" />
  }
  if (isEdit && productQuery.error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {productQuery.error.message}
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        backHref="#/admin/produits"
        backLabel="Retour aux parfums"
        eyebrow="Catalogue"
        title={isEdit ? 'Modifier le parfum' : 'Nouveau parfum'}
        description={
          isEdit
            ? 'Mettez à jour les informations, les images et la disponibilité.'
            : 'Ajoutez un nouveau parfum au catalogue de la boutique.'
        }
      />

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        {/* Informations principales */}
        <AdminCard className="p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-forest">
            Informations
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="product-name">Nom</Label>
              <Input
                id="product-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="ex. Ambre Impérial"
                aria-invalid={Boolean(errors.name)}
              />
              <FieldError message={errors.name} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-slug">Lien (slug)</Label>
              <Input
                id="product-slug"
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true)
                  setSlug(event.target.value)
                }}
                placeholder="mon-parfum"
                aria-invalid={Boolean(errors.slug)}
              />
              <p className="text-xs text-muted-foreground">
                Généré à partir du nom tant qu&apos;il n&apos;est pas modifié. ex. mon-parfum
              </p>
              <FieldError message={errors.slug} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-category">Catégorie</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as Category)}
              >
                <SelectTrigger id="product-category" aria-label="Catégorie du parfum">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {CATEGORY_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.category} />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="product-price-on-demand"
                  checked={priceOnDemand}
                  onCheckedChange={(checked) => setPriceOnDemand(checked === true)}
                />
                <Label htmlFor="product-price-on-demand" className="font-normal">
                  Prix sur demande
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={priceInput}
                  onChange={(event) => setPriceInput(event.target.value)}
                  disabled={priceOnDemand}
                  placeholder="0,00"
                  className="pr-8"
                  aria-label="Prix en francs"
                  aria-invalid={Boolean(errors.price)}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  F
                </span>
              </div>
              <FieldError message={errors.price} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-stock">Stock</Label>
              <Input
                id="product-stock"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={stockInput}
                onChange={(event) => setStockInput(event.target.value)}
                placeholder="ex. 12"
                aria-label="Stock disponible"
                aria-invalid={Boolean(errors.stock)}
              />
              <p className="text-xs text-muted-foreground">
                Laisser vide si vous ne gérez pas de stock
              </p>
              <FieldError message={errors.stock} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-lg border bg-cream/50 px-4 py-3">
                <div>
                  <Label htmlFor="product-available" className="font-normal">
                    Disponible
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Visible et commandable sur la boutique
                  </p>
                </div>
                <Switch
                  id="product-available"
                  checked={isAvailable}
                  onCheckedChange={setIsAvailable}
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border bg-cream/50 px-4 py-3">
                <div>
                  <Label htmlFor="product-featured" className="font-normal">
                    En vedette
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Affiché dans « Nos incontournables » sur l&apos;accueil
                  </p>
                </div>
                <Switch
                  id="product-featured"
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Présentez ce parfum…"
                aria-invalid={Boolean(errors.description)}
              />
              <FieldError message={errors.description} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="product-notes">Informations complémentaires</Label>
              <Textarea
                id="product-notes"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Notes olfactives, contenance, conseils…"
                aria-invalid={Boolean(errors.notes)}
              />
              <FieldError message={errors.notes} />
            </div>
          </div>
        </AdminCard>

        {/* Images */}
        <AdminCard className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-forest">
                Images
              </h2>
              <p className="text-xs text-muted-foreground">
                JPG, PNG ou WebP · 5 Mo maximum · {MAX_IMAGES} images maximum
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending || images.length >= MAX_IMAGES}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="size-4" aria-hidden="true" />
              )}
              Ajouter une image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onFileChange}
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>

          {images.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Aucune image pour le moment. La première image ajoutée devient
              l&apos;image principale du parfum.
            </p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {images.map((img, index) => (
                <div key={`${img.url}-${index}`} className="w-24">
                  <div className="relative">
                    <Image
                      src={img.url}
                      alt={img.alt || 'Image du parfum'}
                      width={96}
                      height={96}
                      className="size-24 rounded-lg border object-cover"
                    />
                    {img.isPrimary ? (
                      <span className="absolute left-1 top-1 rounded-full bg-forest-deep px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white">
                        Principale
                      </span>
                    ) : null}
                    <div className="absolute inset-x-1 bottom-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(index)}
                        disabled={img.isPrimary}
                        aria-label="Définir comme image principale"
                        className="rounded-md bg-white/90 p-1 shadow-sm transition-colors hover:bg-white disabled:opacity-70"
                      >
                        <Star
                          className={
                            img.isPrimary
                              ? 'size-3.5 fill-gold text-gold'
                              : 'size-3.5 text-forest'
                          }
                          aria-hidden="true"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        aria-label="Retirer cette image"
                        className="rounded-md bg-white/90 p-1 shadow-sm transition-colors hover:bg-destructive/90 hover:text-white"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <Input
                    value={img.alt}
                    onChange={(event) => updateAlt(index, event.target.value)}
                    placeholder="Texte alternatif (accessibilité)"
                    aria-label={`Texte alternatif de l'image ${index + 1}`}
                    className="mt-1.5 h-8 text-xs"
                  />
                </div>
              ))}
            </div>
          )}
        </AdminCard>

        {/* Actions du formulaire */}
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <a href="#/admin/produits">Annuler</a>
          </Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            <SubmitLabel
              pending={saveMutation.isPending}
              idle={isEdit ? 'Enregistrer les modifications' : 'Créer le parfum'}
            />
          </Button>
        </div>
      </form>

      {/* Zone de danger (édition uniquement) */}
      {isEdit && productId ? (
        <div className="rounded-xl border border-destructive/40 p-6">
          <h2 className="font-display text-lg font-semibold text-destructive">
            Zone de danger
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            La suppression du parfum est définitive et le retire de la boutique.
          </p>
          <ConfirmDialog
            trigger={
              <Button
                type="button"
                variant="destructive"
                className="mt-4"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                Supprimer ce parfum
              </Button>
            }
            title="Supprimer ce parfum ?"
            description="Cette action est définitive. Le parfum sera retiré de la boutique."
            confirmLabel="Supprimer définitivement"
            onConfirm={() => deleteMutation.mutate(productId)}
          />
        </div>
      ) : null}
    </div>
  )
}
