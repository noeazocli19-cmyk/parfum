// Panneau latéral du panier — contenu rendu après montage (évite les écarts d'hydratation).

'use client'

import { useMounted } from '@/hooks/use-mounted'
import Image from 'next/image'
import { ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { EmptyState } from '@/components/shared/empty-state'
import { PriceText } from '@/components/shared/price-text'
import { QuantityStepper } from '@/components/shared/quantity-stepper'
import { Spinner } from '@/components/shared/spinner'
import { CATEGORY_LABELS_SHORT, formatPrice } from '@/lib/format'
import { cartCount, cartHasUndeterminedPrice, cartSubtotal, useCart } from '@/store/cart'

export function CartDrawer({
  open,
  onOpenChange,
  navigate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  navigate: (to: string, options?: { replace?: boolean }) => void
}) {
  const mounted = useMounted()
  const items = useCart((state) => state.items)
  const setQuantity = useCart((state) => state.setQuantity)
  const removeItem = useCart((state) => state.removeItem)

  const count = cartCount(items)
  const subtotal = cartSubtotal(items)
  const undetermined = cartHasUndeterminedPrice(items)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/70 px-6 py-5">
          <SheetTitle className="font-display text-2xl font-semibold text-forest">
            Votre panier
          </SheetTitle>
          <SheetDescription>
            {mounted ? `${count} article${count > 1 ? 's' : ''}` : 'Chargement…'}
          </SheetDescription>
        </SheetHeader>

        {!mounted ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={ShoppingBag}
              title="Votre panier est vide"
              description="Parcourez la boutique pour trouver votre parfum."
              action={
                <Button asChild className="bg-forest-deep hover:bg-pine-deep">
                  <a href="#/boutique" onClick={() => onOpenChange(false)}>
                    Découvrir nos parfums
                  </a>
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border/70 overflow-y-auto px-6">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-4 py-4">
                  <a
                    href={`#/parfum/${encodeURIComponent(item.slug)}`}
                    onClick={() => onOpenChange(false)}
                    aria-label={`Voir le parfum ${item.name}`}
                    className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-cream"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={`Flacon du parfum ${item.name}`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center font-display text-lg text-forest/25">
                        BO
                      </span>
                    )}
                  </a>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <a
                      href={`#/parfum/${encodeURIComponent(item.slug)}`}
                      onClick={() => onOpenChange(false)}
                      className="truncate font-display text-lg font-semibold leading-snug text-ink transition-colors hover:text-forest"
                    >
                      {item.name}
                    </a>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-gold-deep">
                      {CATEGORY_LABELS_SHORT[item.category]}
                    </span>
                    <PriceText price={item.price} className="text-xs text-muted-foreground" />
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <QuantityStepper
                        size="sm"
                        value={item.quantity}
                        onChange={(quantity) => setQuantity(item.productId, quantity)}
                        ariaLabel={`Quantité de ${item.name}`}
                      />
                      <PriceText
                        price={item.price === null ? null : item.price * item.quantity}
                        className="text-sm text-forest"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Retirer ${item.name} du panier`}
                    className="flex size-9 shrink-0 items-center justify-center self-start rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="border-t border-border/70 bg-cream/60 px-6 py-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                {undetermined ? (
                  <span className="italic text-gold-deep">À confirmer par téléphone</span>
                ) : (
                  <span className="font-medium text-ink">{formatPrice(subtotal)}</span>
                )}
              </div>
              {undetermined ? (
                <p className="mt-2 text-xs leading-relaxed text-gold-deep">
                  Certains produits sont à « prix sur demande » : le montant définitif sera
                  confirmé par téléphone.
                </p>
              ) : null}
              <div className="mt-4 grid gap-2">
                <Button
                  className="h-11 w-full bg-forest-deep hover:bg-pine-deep"
                  onClick={() => {
                    onOpenChange(false)
                    navigate('#/commande')
                  }}
                >
                  Passer la commande
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
                  Continuer mes achats
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
