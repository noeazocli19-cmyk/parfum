// Page introuvable — retour à l'accueil.

'use client'

import { Button } from '@/components/ui/button'

export function NotFoundView() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-5 px-4 py-24 text-center sm:px-6">
      <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold-deep">
        404
      </span>
      <h1 className="font-display text-3xl font-semibold text-forest sm:text-4xl">
        Cette page n’existe pas ou a été déplacée.
      </h1>
      <Button asChild className="mt-2 h-11 bg-forest-deep px-8 hover:bg-pine-deep">
        <a href="#/">Retour à l’accueil</a>
      </Button>
    </section>
  )
}
