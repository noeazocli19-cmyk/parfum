// Commande — formulaire client + récapitulatif, envoi via l'API publique.

'use client'

import { useState } from 'react'
import { useMounted } from '@/hooks/use-mounted'
import Image from 'next/image'
import { useMutation } from '@tanstack/react-query'
import { Loader2, MessageCircle, PhoneCall, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import { formatPrice, telHref } from '@/lib/format'
import { PAYMENT_INFO } from '@/lib/shop-config'
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
    mutationFn: (input: any) => api.createOrder(input),
    onSuccess: (data: any) => {
      // 1. Vider le panier
      clear()

      // 2. Construire la liste brute des produits commandés
      let detailParfums = ""
      items.forEach((item) => {
        detailParfums += "* Parfum : " + item.name + "\n* Quantité : " + item.quantity + "\n* Prix : " + (item.price !== null ? formatPrice(item.price) : 'Prix sur demande') + "\n\n"
      })

      // 3. Générer le template de message en gras sans aucune fonction externe
      const texteWhatsApp = "Bonjour, je souhaite commander :\n\n" + 
        detailParfums + 
        "* Nom du client : " + form.customerName.trim() + "\n" + 
        "* Numéro du client : " + form.phone.trim() + "\n" + 
        "* Référence de commande : " + data.reference + "\n" + 
        "* Autres informations : " + (form.comment.trim() || "Aucune")

      // 4. Nettoyer proprement le numéro de l'administrateur
      const telAdminBrut = settings?.phone || "0166491298"
      let telAdminNettoye = telAdminBrut.replace(/\s+/g, "").replace("+", "")
      
      if (telAdminNettoye.startsWith("01") || telAdminNettoye.startsWith("66") || telAdminNettoye.startsWith("49")) {
        if (!telAdminNettoye.startsWith("229")) {
          telAdminNettoye = "229" + telAdminNettoye
        }
      }

      // 5. Concaténation pure (évite à 100% le bug d'écriture de variables de Turbopack)
      const urlFinale = "https://wa.me" + telAdminNettoye + "?text=" + encodeURIComponent(texteWhatsApp)
      
      // 6. Redirection immédiate
      window.location.href = urlFinale
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
        Renseignez vos coordonnées : la commande sera enregistrée et vous serez redirigé vers WhatsApp pour finaliser l'envoi.
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

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="h-11 bg-forest-deep hover:bg-pine-deep sm:px-10"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Envoi en cours…
                </>
              ) : (
                <>
                  <MessageCircle className="mr-2 size-4" />
                  Commander maintenant
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="rounded-xl border border-border bg-muted/30 p-6 self-start">
          <h2 className="font-display text-xl font-semibold text-forest">Récapitulatif</h2>
          <div className="mt-4 divide-y divide-border">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Qté: {item.quantity}</p>
                </div>
                <p className="font-medium text-foreground">                   {item.price !== null ? formatPrice(item.price * item.quantity) : 'Sur demande'}
                </p>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <PriceText price={undetermined ? null : subtotal} className="text-lg font-bold text-forest-deep" />
          </div>
        </div>
      </div>
    </section>
  )
}

