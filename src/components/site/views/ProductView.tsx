// Fiche produit — galerie, informations, ajout au panier, suggestions.

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, PhoneCall, SearchX, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/lib/types'
import { CATEGORY_LABELS } from '@/lib/types'
import { api } from '@/lib/api-client'
import { CATEGORY_LABELS_SHORT, telHref } from '@/lib/format'
import { useCart } from '@/store/cart'
import { cn } from '@/lib/utils'
import { useSettings } from '../use-settings'
import { SampleBadge } from '@/components/shared/sample-badge'
import { PriceText } from '@/components/shared/price-text'
import { QuantityStepper } from '@/components/shared/quantity-stepper'
import { SectionHeading } from '@/components/shared/section-heading'
import { EmptyState } from '@/components/shared/empty-state'
import { Spinner } from '@/components/shared/spinner'
import { ProductCard } from '@/components/shared/product-card'
import { Button } from '@/components/ui/button'

export function ProductView({
  slug,
  navigate,
}: {
  slug: string
  navigate: (to: string, options?: { replace?: boolean }) => void
}) {
  const { settings } = useSettings()
  const query = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.getProduct(slug),
    enabled: slug !== '',
  })

  const product = query.data?.product

  const suggestions = useQuery({
    queryKey: ['products', 'suggestions', { categorie: product?.category, excludeId: product?.id }],
    queryFn: () =>
      api.getProducts({ categorie: product?.category, excludeId: product?.id }),
    enabled: !!product,
  })

  if (slug === '' || query.error || (!query.isLoading && !product)) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:py-24">
        <EmptyState
          icon={SearchX}
          title="Parfum introuvable"
          description="Ce parfum n’existe pas ou n’est plus référencé."
          action={
            <Button asChild className="bg-forest-deep hover:bg-pine-deep">
              <a href="#/boutique">Retour à la boutique</a>
            </Button>
          }
        />
      </section>
    )
  }

  if (query.isLoading || !product) {
    return <Spinner />
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    category: CATEGORY_LABELS[product.category],
    offers: {
      '@type': 'Offer',
      availability: product.isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      ...(product.price !== null
        ? { price: product.price, priceCurrency: 'EUR' }
        : {}),
    },
  }

  const suggestionProducts = (suggestions.data?.products ?? []).slice(0, 4)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <a href="#/" className="transition-colors hover:text-forest">
            Accueil
          </a>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <a href="#/boutique" className="transition-colors hover:text-forest">
            Boutique
          </a>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <span aria-current="page" className="truncate text-ink/70">
            {product.name}
          </span>
        </nav>

        <ProductDetail key={product.id} product={product} phone={settings.contactPhone} navigate={navigate} />

        {suggestionProducts.length > 0 ? (
          <section className="mt-16 border-t border-border/70 pt-12 lg:mt-20 lg:pt-16">
            <SectionHeading eyebrow="Suggestions" title="Vous aimerez aussi" />
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {suggestionProducts.map((item, index) => (
                <ProductCard key={item.id} product={item} index={index} />
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </>
  )
}

function ProductDetail({
  product,
  phone,
  navigate,
}: {
  product: Product
  phone: string
  navigate: (to: string, options?: { replace?: boolean }) => void
}) {
  const addItem = useCart((state) => state.addItem)
  const [quantity, setQuantity] = useState(1)
  const maxQuantity = product.stock ?? 99

  const onAddToCart = () => {
    addItem(product, quantity)
    toast.success(`${product.name} ajouté au panier`, {
      action: { label: 'Voir le panier', onClick: () => navigate('#/panier') },
    })
  }

  const onOrderNow = () => {
    addItem(product, quantity)
    navigate('#/commande')
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-10">
      <Gallery product={product} />

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold-deep">
            {CATEGORY_LABELS_SHORT[product.category]}
          </span>
          {product.isSample ? <SampleBadge /> : null}
        </div>

        <h1 className="font-display text-3xl font-semibold leading-tight text-forest lg:text-4xl">
          {product.name}
        </h1>

        <p className="flex items-center gap-2 text-sm">
          <span
            aria-hidden="true"
            className={cn('size-2 rounded-full', product.isAvailable ? 'bg-forest-deep' : 'bg-stone-400')}
          />
          <span className={product.isAvailable ? 'text-forest' : 'text-stone-500'}>
            {product.isAvailable ? 'Disponible' : 'Indisponible'}
          </span>
        </p>

        <PriceText
          price={product.price}
          className="text-2xl text-forest"
          undeterminedClassName="text-base italic text-muted-foreground"
        />

        {product.description ? (
          <p className="whitespace-pre-line leading-relaxed text-ink/80">{product.description}</p>
        ) : null}

        {product.notes ? (
          <div className="border-t border-border/70 pt-5">
            <h2 className="text-xs font-medium uppercase tracking-[0.25em] text-gold-deep">
              Informations complémentaires
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.notes}
            </p>
          </div>
        ) : null}

        {product.isAvailable ? (
          <>
            <div className="flex items-center gap-3">
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={maxQuantity}
                ariaLabel={`Quantité de ${product.name}`}
              />
              {product.stock !== null && product.stock < quantity + 5 ? (
                <span className="text-xs text-muted-foreground">
                  Stock limité : {product.stock} disponible{product.stock > 1 ? 's' : ''}
                </span>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={onAddToCart}
                className="h-11 flex-1 bg-forest-deep px-8 hover:bg-pine-deep sm:flex-none"
              >
                <ShoppingBag className="size-4" aria-hidden="true" />
                Ajouter au panier
              </Button>
              <Button
                variant="outline"
                onClick={onOrderNow}
                className="h-11 flex-1 border-forest/30 bg-transparent px-8 text-forest hover:border-forest hover:bg-cream sm:flex-none"
              >
                Commander maintenant
              </Button>
            </div>
          </>
        ) : (
          <Button disabled className="h-11 w-full max-w-xs">
            Épuisé
          </Button>
        )}

        <p className="flex flex-wrap items-center gap-2 border-t border-border/70 pt-5 text-sm text-muted-foreground">
          <PhoneCall className="size-4 shrink-0 text-gold-deep" aria-hidden="true" />
          <span>Une question ? Appelez-nous au</span>
          <a
            href={telHref(phone)}
            className="font-medium text-forest underline decoration-gold/50 underline-offset-4 transition-colors hover:decoration-gold"
          >
            {phone}
          </a>
        </p>
      </div>
    </div>
  )
}

function Gallery({ product }: { product: Product }) {
  const [index, setIndex] = useState(0)
  const images = product.images
  const current = images[index] ?? null

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-cream">
        {current ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.url}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute inset-0"
            >
              <Image
                src={current.url}
                alt={current.alt || `Flacon du parfum ${product.name}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-7xl text-forest/15">BO</span>
          </div>
        )}
        {product.isSample ? (
          <div className="absolute left-3 top-3">
            <SampleBadge className="bg-white/90" />
          </div>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {images.map((image, imageIndex) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setIndex(imageIndex)}
              aria-label={`Afficher l’image ${imageIndex + 1}`}
              aria-current={imageIndex === index}
              className={cn(
                'relative size-[72px] overflow-hidden rounded-lg border-2 bg-cream transition-colors',
                imageIndex === index
                  ? 'border-gold'
                  : 'border-transparent hover:border-forest/25'
              )}
            >
              <Image src={image.url} alt="" fill sizes="72px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
