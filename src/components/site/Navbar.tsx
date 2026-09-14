// Barre de navigation collante — logo, liens, recherche, panier, menu mobile.

'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, PhoneCall, Search, ShoppingBag, X } from 'lucide-react'
import type { Route } from '@/lib/types'
import { buildHash } from '@/hooks/use-hash-route'
import { useMounted } from '@/hooks/use-mounted'
import { cartCount, useCart } from '@/store/cart'
import { telHref } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useSettings } from './use-settings'
import { ThemeToggle } from './theme-toggle'

interface NavLink {
  label: string
  href: string
  isActive: (route: Route) => boolean
}

const NAV_LINKS: NavLink[] = [
  {
    label: 'Accueil',
    href: '#/',
    isActive: (route) => route.segments.length === 0,
  },
  {
    label: 'Boutique',
    href: '#/boutique',
    isActive: (route) => route.segments[0] === 'boutique' && !route.query.categorie,
  },
  {
    label: 'Homme',
    href: buildHash('boutique', { categorie: 'HOMME' }),
    isActive: (route) => route.segments[0] === 'boutique' && route.query.categorie === 'HOMME',
  },
  {
    label: 'Femme',
    href: buildHash('boutique', { categorie: 'FEMME' }),
    isActive: (route) => route.segments[0] === 'boutique' && route.query.categorie === 'FEMME',
  },
  {
    label: 'À propos',
    href: '#/a-propos',
    isActive: (route) => route.segments[0] === 'a-propos',
  },
  {
    label: 'Contact',
    href: '#/contact',
    isActive: (route) => route.segments[0] === 'contact',
  },
]

export function Navbar({
  route,
  onOpenCart,
  onOpenSearch,
}: {
  route: Route
  onOpenCart: () => void
  onOpenSearch: () => void
}) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [lastRouteRaw, setLastRouteRaw] = useState(route.raw)
  const mounted = useMounted()
  const items = useCart((state) => state.items)
  const lastAddedAt = useCart((state) => state.lastAddedAt)
  const { settings } = useSettings()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Ferme le menu mobile à chaque changement de page (ajustement pendant le rendu).
  if (lastRouteRaw !== route.raw) {
    setLastRouteRaw(route.raw)
    if (menuOpen) setMenuOpen(false)
  }

  // Bloque le défilement du corps quand le menu mobile est ouvert.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const count = cartCount(items)

  return (
    <>
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border/60 bg-white/90 backdrop-blur-md transition-shadow duration-300',
        scrolled && 'shadow-[0_10px_30px_-18px_rgba(11,61,46,0.35)]'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
        <a
          href="#/"
          className="flex shrink-0 items-center gap-3"
          aria-label="E.T.P.S Belle Odeur — retour à l’accueil"
        >
          <Image
            src="/images/logo.jpg"
            alt="Emblème de la maison E.T.P.S Belle Odeur"
            width={44}
            height={44}
            priority
            className="h-10 w-10 rounded-full border border-gold/40 object-cover"
          />
          <span className="flex flex-col leading-none">
            <span className="text-[10px] uppercase tracking-[0.35em] text-gold-deep">
              E.T.P.S
            </span>
            <span className="mt-1 font-display text-lg font-semibold leading-none tracking-wide text-forest">
              BELLE ODEUR
            </span>
          </span>
        </a>

        <nav aria-label="Navigation principale" className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = link.isActive(route)
            return (
              <a
                key={link.label}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative py-1 text-sm transition-colors',
                  active ? 'font-medium text-forest' : 'text-ink/70 hover:text-forest'
                )}
              >
                {link.label}
                {active ? (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-0 -bottom-0.5 h-px bg-gold"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                ) : null}
              </a>
            )
          })}
        </nav>

        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Rechercher un parfum"
            className="flex size-11 items-center justify-center rounded-full text-forest transition-colors hover:bg-forest/5"
          >
            <Search className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Ouvrir le panier${mounted && count > 0 ? ` (${count} article${count > 1 ? 's' : ''})` : ''}`}
            className="relative flex size-11 items-center justify-center rounded-full text-forest transition-colors hover:bg-forest/5"
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            {mounted && count > 0 ? (
              <motion.span
                key={lastAddedAt}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className="absolute right-0.5 top-0.5 flex size-[18px] items-center justify-center rounded-full bg-forest-deep text-[10px] font-semibold leading-none text-white"
              >
                {count}
              </motion.span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
            className="flex size-11 items-center justify-center rounded-full text-forest transition-colors hover:bg-forest/5 lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>

    <AnimatePresence>
        {menuOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex h-full flex-col overflow-y-auto bg-white lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navigation"
          >
            <div className="flex h-16 items-center justify-between px-4 sm:px-6">
              <span className="flex items-center gap-3">
                <Image
                  src="/images/logo.jpg"
                  alt="Emblème de la maison E.T.P.S Belle Odeur"
                  width={44}
                  height={44}
                  className="h-10 w-10 rounded-full border border-gold/40 object-cover"
                />
                <span className="flex flex-col leading-none">
                  <span className="text-[10px] uppercase tracking-[0.35em] text-gold-deep">
                    E.T.P.S
                  </span>
                  <span className="mt-1 font-display text-lg font-semibold leading-none tracking-wide text-forest">
                    BELLE ODEUR
                  </span>
                </span>
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Fermer le menu"
                className="flex size-11 items-center justify-center rounded-full text-forest transition-colors hover:bg-forest/5"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Navigation mobile" className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 pt-8">
              {NAV_LINKS.map((link, index) => {
                const active = link.isActive(route)
                return (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.05 + index * 0.05, ease: 'easeOut' }}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 border-b border-border/50 py-4 font-display text-2xl font-semibold transition-colors',
                      active ? 'text-forest' : 'text-ink/70'
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn('h-px w-6', active ? 'bg-gold' : 'bg-border')}
                    />
                    {link.label}
                  </motion.a>
                )
              })}
            </nav>
            <div className="px-6 pb-10">
              <a
                href={telHref(settings.contactPhone)}
                className="flex items-center gap-3 rounded-xl border border-border bg-cream px-4 py-4 text-forest"
              >
                <PhoneCall className="size-5 shrink-0 text-gold-deep" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-[0.22em] text-gold-deep">
                    Commandes par téléphone
                  </span>
                  <span className="block font-medium">{settings.contactPhone}</span>
                </span>
              </a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
