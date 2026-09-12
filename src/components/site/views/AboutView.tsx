// À propos — bandeau visuel + textes de la maison (réglages administrables).

'use client'

import Image from 'next/image'
import { PhoneCall } from 'lucide-react'
import { telHref } from '@/lib/format'
import { useSettings } from '../use-settings'
import { SectionHeading } from '@/components/shared/section-heading'
import { Button } from '@/components/ui/button'

export function AboutView() {
  const { settings } = useSettings()

  const sections = [
    { title: 'Notre maison', text: settings.aboutIntro },
    { title: 'Notre univers', text: settings.aboutStory },
    { title: 'Nos valeurs', text: settings.aboutValues },
    { title: 'Notre vision', text: settings.aboutVision },
  ]

  return (
    <>
      <section className="relative flex h-64 items-center justify-center overflow-hidden bg-forest-deep lg:h-80">
        <Image
          src="/images/a-propos.jpg"
          alt="Univers et univers visuel de la maison E.T.P.S Belle Odeur"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-forest-deep/70" aria-hidden="true" />
        <div className="relative flex flex-col items-center gap-3 px-4 text-center">
          <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
            La maison
          </span>
          <h1 className="font-display text-4xl font-semibold text-white sm:text-5xl">
            À propos
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="space-y-12">
          {sections.map((section) => (
            <article key={section.title}>
              <SectionHeading align="left" title={section.title} className="mb-5" />
              <p className="whitespace-pre-line leading-relaxed text-ink/80">{section.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-14 rounded-xl border border-border bg-cream p-8 text-center">
          <p className="text-base leading-relaxed text-ink/85">
            Pour toute demande, notre équipe vous répond au{' '}
            <a
              href={telHref(settings.contactPhone)}
              className="font-semibold text-forest underline decoration-gold/50 underline-offset-4 transition-colors hover:decoration-gold"
            >
              {settings.contactPhone}
            </a>
            .
          </p>
          <Button asChild className="mt-5 bg-forest-deep hover:bg-pine-deep">
            <a href={telHref(settings.contactPhone)}>
              <PhoneCall className="size-4" aria-hidden="true" />
              Appeler
            </a>
          </Button>
        </div>
      </section>
    </>
  )
}
