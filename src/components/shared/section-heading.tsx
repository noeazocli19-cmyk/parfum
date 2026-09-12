// Titre de section — eyebrow doré + titre serif.

'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className={cn(
        'mb-10 flex flex-col gap-3',
        align === 'center' ? 'items-center text-center' : 'items-start',
        className
      )}
    >
      {eyebrow ? (
        <span className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-gold-deep">
          <span className="h-px w-8 bg-gold/60" aria-hidden="true" />
          {eyebrow}
          {align === 'center' && (
            <span className="h-px w-8 bg-gold/60" aria-hidden="true" />
          )}
        </span>
      ) : null}
      <h2 className="font-display text-3xl font-semibold leading-tight text-forest sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      ) : null}
    </motion.div>
  )
}
