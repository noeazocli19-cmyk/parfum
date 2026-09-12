// Confirmation de commande — référence mise en évidence, retour boutique.

'use client'

import { motion } from 'framer-motion'
import { Check, PhoneCall } from 'lucide-react'
import { telHref } from '@/lib/format'
import { useSettings } from '../use-settings'
import { Button } from '@/components/ui/button'

export function ConfirmationView({ reference }: { reference: string }) {
  const { settings } = useSettings()

  return (
    <section className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6 lg:py-24">
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="mx-auto flex size-20 items-center justify-center rounded-full bg-gold shadow-[0_18px_40px_-18px_rgba(201,162,39,0.55)]"
      >
        <Check className="size-10 text-white" aria-hidden="true" />
      </motion.div>

      <h1 className="mt-6 font-display text-4xl font-semibold text-forest">Merci !</h1>
      <p className="mt-3 text-base text-muted-foreground">
        Votre commande a bien été enregistrée.
      </p>

      <div className="mt-6 inline-flex flex-col items-center gap-1 rounded-xl bg-cream px-8 py-4">
        <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold-deep">
          Référence de commande
        </span>
        <span className="font-display text-xl font-semibold tracking-wide text-forest">
          {reference}
        </span>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        Notre équipe vous contactera au numéro indiqué pour confirmer votre commande.
      </p>

      <p className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-gold-deep">
        <PhoneCall className="size-4 shrink-0" aria-hidden="true" />
        <span>Une question ? Appelez-nous au</span>
        <a
          href={telHref(settings.contactPhone)}
          className="font-semibold text-forest underline decoration-gold/50 underline-offset-4 transition-colors hover:decoration-gold"
        >
          {settings.contactPhone}
        </a>
      </p>

      <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild className="h-11 bg-forest-deep px-8 hover:bg-pine-deep">
          <a href="#/boutique">Retour à la boutique</a>
        </Button>
        <Button asChild variant="ghost" className="h-11 text-forest">
          <a href="#/">Retour à l’accueil</a>
        </Button>
      </div>
    </section>
  )
}
