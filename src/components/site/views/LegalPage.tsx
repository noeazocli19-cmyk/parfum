'use client'

import type { ReactNode } from 'react'

interface LegalPageProps {
  title: string
  intro: string
  sections: { title: string; body: ReactNode }[]
}

export function LegalPage({ title, intro, sections }: LegalPageProps) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold-deep">
        Informations légales
      </span>
      <h1 className="mt-3 font-display text-3xl font-semibold text-forest sm:text-4xl lg:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        {intro}
      </p>

      <div className="mt-8 space-y-6">
        {sections.map((section) => (
          <article key={section.title} className="rounded-xl border border-border bg-white p-5 sm:p-7">
            <h2 className="font-display text-xl font-semibold text-forest sm:text-2xl">
              {section.title}
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink/80">
              {section.body}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
