// Commande — formulaire client + récapitulatif, envoi via l'API publique.

'use client'

import { useState } from 'react'
import { useMounted } from '@/hooks/use-mounted'
import Image from 'next/image'
import { useMutation } from '@tanstack/react-query'
import { Loader2, PhoneCall, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import { formatPrice, telHref } from '@/lib/format'
import { cartHasUndeterminedPrice, cartSubtotal, useCart } from '@/store/cart'
import { useSettings } from '../use-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { PriceText } from '@/components/shared/price-text'
import { Spinner } from '@/components/shared/spinner'

interface CheckoutForm {
  customerName: string
  phone: string
  address: string
  comment: string
}

type CheckoutErrors = Partial<Record<'customerName' | 'phone' | 'address', string>>

const EMPTY_FORM: CheckoutForm = { customerName: '', phone: '', address: '', comment: '' }

export function CheckoutView({
  navigate,
}: {
  navigate: (to: string, options?: { replace?: boolean }) => void
}) {
  const mounted = useMounted()
  const items = useCart((state) => state.items)
  const clear = useCart((state) => state.clear)
  const { settings } = useSettings()
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<CheckoutErrors>({})

  const undetermined = cartHasUndeterminedPrice(items)
  const subtotal = cartSubtotal(items)

  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof api.createOrder>[0]) => api.createOrder(input),
    onSuccess: (data) => {
      clear()
      navigate(`#/confirmation/${encodeURIComponent(data.reference)}`)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue. Veuillez réessayer.'
      )
    },
  })

  if (!mounted) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Spinner />
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <EmptyState
          icon={ShoppingBag}
          title="Votre panier est vide"
          description="Ajoutez des parfums à votre panier avant de passer commande."
          action={
            <Button asChild className="bg-forest-deep hover:bg-pine-deep">
              <a href="#/boutique">Découvrir nos parfums</a>
            </Button>
          }
        />
      </section>
    )
  }

  const validate = (): boolean => {
    const next: CheckoutErrors = {}
    if (form.customerName.trim().length < 2) {
      next.customerName = 'Veuillez indiquer votre nom complet.'
    }
    if (form.phone.trim().length < 6) {
      next.phone = 'Veuillez indiquer un numéro de téléphone valide.'
    }
    if (form.address.trim().length < 5) {
      next.address = 'Veuillez indiquer votre adresse ou zone de livraison.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate() || mutation.isPending) return
    mutation.mutate({
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      comment: form.comment.trim() || undefined,
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    })
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold-deep">
        Finalisation
      </span>
      <h1 className="mt-3 font-display text-3xl font-semibold text-forest sm:text-4xl lg:text-5xl">
        Votre commande
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Renseignez vos coordonnées : notre équipe vous contacte par téléphone pour confirmer
        votre commande et les modalités de livraison.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <form onSubmit={onSubmit} noValidate className="rounded-xl border border-border bg-white p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-forest">Vos coordonnées</h2>

          <div className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="checkout-name">Nom complet</Label>
              <Input
                id="checkout-name"
                value={form.customerName}
                onChange={(event) =>
                  setForm((state) => ({ ...state, customerName: event.target.value }))
                }
                placeholder="Prénom et nom"
                autoComplete="name"
                aria-invalid={!!errors.customerName}
              />
              {errors.customerName ? (
                <p className="text-xs text-destructive">{errors.customerName}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="checkout-phone">Téléphone</Label>
              <Input
                id="checkout-phone"
                type="tel"
                value={form.phone}
                onChange={(event) => setForm((state) => ({ ...state, phone: event.target.value }))}
                placeholder="Ex. 06 12 34 56 78"
                autoComplete="tel"
                aria-invalid={!!errors.phone}
              />
              {errors.phone ? <p className="text-xs text-destructive">{errors.phone}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="checkout-address">Adresse / zone de livraison</Label>
              <Textarea
                id="checkout-address"
                value={form.address}
                onChange={(event) =>
                  setForm((state) => ({ ...state, address: event.target.value }))
                }
                placeholder="Adresse complète, quartier, points de repère…"
                rows={3}
                aria-invalid={!!errors.address}
              />
              {errors.address ? (
                <p className="text-xs text-destructive">{errors.address}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="checkout-comment">Commentaire éventuel</Label>
              <Textarea
                id="checkout-comment"
                value={form.comment}
                onChange={(event) =>
                  setForm((state) => ({ ...state, comment: event.target.value }))
                }
                placeholder="Précisions sur votre commande, horaires de livraison…"
                rows={3}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="mt-7 h-11 w-full bg-forest-deep hover:bg-pine-deep sm:w-auto sm:px-10"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Envoi en cours…
              </>
            ) : (
              'Valider ma commande'
            )}
          </Button>
        </form>

        <aside
          aria-label="Récapitulatif de la commande"
          className="h-fit rounded-xl border border-border bg-white p-6 lg:sticky lg:top-24"
        >
          <h2 className="font-display text-2xl font-semibold text-forest">Récapitulatif</h2>
          <ul className="mt-3 divide-y divide-border/70">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3 py-3">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-cream">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={`Flacon du parfum ${item.name}`}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center font-display text-sm text-forest/25">
                      BO
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    Quantité : {item.quantity}
                  </span>
                </span>
                <PriceText
                  price={item.price === null ? null : item.price * item.quantity}
                  className="shrink-0 text-sm text-forest"
                />
              </li>
            ))}
          </ul>
          <a
            href="#/panier"
            className="mt-2 inline-block text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-forest"
          >
            Modifier le panier
          </a>

          <Separator className="my-4" />
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-ink">Total</span>
            {undetermined ? (
              <span className="text-right text-sm italic text-gold-deep">
                Montant à confirmer par téléphone
              </span>
            ) : (
              <span className="font-display text-2xl font-semibold text-forest">
                {formatPrice(subtotal)}
              </span>
            )}
          </div>
          {undetermined ? (
            <p className="mt-3 text-xs leading-relaxed text-gold-deep">
              Certains produits sont à « prix sur demande » : le montant définitif sera confirmé
              par téléphone.
            </p>
          ) : null}

          <div className="mt-5 flex items-center gap-3 rounded-lg bg-cream p-4">
            <PhoneCall className="size-5 shrink-0 text-gold-deep" aria-hidden="true" />
            <p className="text-sm text-ink/80">
              Besoin d’aide ?{' '}
              <a
                href={telHref(settings.contactPhone)}
                className="font-medium text-forest underline decoration-gold/50 underline-offset-4"
              >
                {settings.contactPhone}
              </a>
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}
