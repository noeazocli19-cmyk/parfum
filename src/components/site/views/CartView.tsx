// Page panier — liste détaillée + récapitulatif collant.

'use client'

import { useMounted } from '@/hooks/use-mounted'
import Image from 'next/image'
import { ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/shared/empty-state'
import { PriceText } from '@/components/shared/price-text'
import { QuantityStepper } from '@/components/shared/quantity-stepper'
import { Spinner } from '@/components/shared/spinner'
import { CATEGORY_LABELS_SHORT, formatPrice } from '@/lib/format'
import { cartCount, cartHasUndeterminedPrice, cartSubtotal, useCart } from '@/store/cart'

export function CartView() {
  const mounted = useMounted()
  const items = useCart((state) => state.items)
  const setQuantity = useCart((state) => state.setQuantity)
  const removeItem = useCart((state) => state.removeItem)

  if (!mounted) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Spinner />
      </section>
    )
  }

  const count = cartCount(items)
  const subtotal = cartSubtotal(items)
  const undetermined = cartHasUndeterminedPrice(items)

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <EmptyState
          icon={ShoppingBag}
          title="Votre panier est vide"
          description="Parcourez la boutique pour trouver votre parfum."
          action={
            <Button asChild className="bg-forest-deep hover:bg-pine-deep">
              <a href="#/boutique">Découvrir nos parfums</a>
            </Button>
          }
        />
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold-deep">
        Votre sélection
      </span>
      <h1 className="mt-3 font-display text-3xl font-semibold text-forest sm:text-4xl lg:text-5xl">
        Votre panier
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {count} article{count > 1 ? 's' : ''}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-border/70 border-y border-border/70">
          {items.map((item) => (
            <li key={item.productId} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
              <a
                href={`#/parfum/${encodeURIComponent(item.slug)}`}
                aria-label={`Voir le parfum ${item.name}`}
                className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-cream"
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={`Flacon du parfum ${item.name}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center font-display text-xl text-forest/25">
                    BO
                  </span>
                )}
              </a>

              <div className="min-w-0 flex-1">
                <a
                  href={`#/parfum/${encodeURIComponent(item.slug)}`}
                  className="font-display text-xl font-semibold leading-snug text-ink transition-colors hover:text-forest"
                >
                  {item.name}
                </a>
                <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-gold-deep">
                  {CATEGORY_LABELS_SHORT[item.category]}
                </p>
                <PriceText price={item.price} className="mt-1 block text-sm text-muted-foreground" />
              </div>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <QuantityStepper
                  size="sm"
                  value={item.quantity}
                  onChange={(quantity) => setQuantity(item.productId, quantity)}
                  ariaLabel={`Quantité de ${item.name}`}
                />
                <PriceText
                  price={item.price === null ? null : item.price * item.quantity}
                  className="min-w-20 text-right text-base text-forest"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  aria-label={`Retirer ${item.name} du panier`}
                  className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <aside
          aria-label="Récapitulatif de la commande"
          className="h-fit rounded-xl border border-border bg-white p-6 lg:sticky lg:top-24"
        >
          <h2 className="font-display text-2xl font-semibold text-forest">Récapitulatif</h2>
          <Separator className="my-4" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span className="font-medium text-ink">{formatPrice(subtotal)}</span>
          </div>
          {undetermined ? (
            <p className="mt-3 text-xs leading-relaxed text-gold-deep">
              Certains produits sont à « prix sur demande » : le montant définitif sera confirmé
              par téléphone.
            </p>
          ) : null}
          <Separator className="my-4" />
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-ink">Total</span>
            {undetermined ? (
              <span className="text-sm italic text-gold-deep">
                Montant à confirmer par téléphone
              </span>
            ) : (
              <span className="font-display text-2xl font-semibold text-forest">
                {formatPrice(subtotal)}
              </span>
            )}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Vous confirmerez les détails de livraison avec notre équipe par téléphone.
          </p>
          <Button asChild className="mt-5 h-11 w-full bg-forest-deep hover:bg-pine-deep">
            <a href="#/commande">Passer la commande</a>
          </Button>
          <a
            href="#/boutique"
            className="mt-3 block text-center text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-forest hover:underline"
          >
            Continuer mes achats
          </a>
        </aside>
      </div>
    </section>
  )
}
