// Assembleur du site public — une seule SPA pilotée par le routeur hash.

'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Route } from '@/lib/types'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { CartDrawer } from './CartDrawer'
import { SearchOverlay } from './SearchOverlay'
import { HomeView } from './views/HomeView'
import { ShopView } from './views/ShopView'
import { ProductView } from './views/ProductView'
import { CartView } from './views/CartView'
import { CheckoutView } from './views/CheckoutView'
import { ConfirmationView } from './views/ConfirmationView'
import { AboutView } from './views/AboutView'
import { ContactView } from './views/ContactView'
import { NotFoundView } from './views/NotFoundView'

export function SiteApp({
  route,
  navigate,
}: {
  route: Route
  navigate: (to: string, options?: { replace?: boolean }) => void
}) {
  const [cartOpen, setCartOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const segments = route.segments

  const view = (() => {
    if (segments.length === 0) return <HomeView />
    switch (segments[0]) {
      case 'boutique':
        return <ShopView route={route} navigate={navigate} />
      case 'parfum':
        return <ProductView slug={segments[1] ?? ''} navigate={navigate} />
      case 'panier':
        return <CartView />
      case 'commande':
        return <CheckoutView navigate={navigate} />
      case 'confirmation':
        return <ConfirmationView reference={segments[1] ?? ''} />
      case 'a-propos':
        return <AboutView />
      case 'contact':
        return <ContactView />
      default:
        return <NotFoundView />
    }
  })()

  // Clé de transition : le chemin sans les paramètres (les filtres ne
  // rejouent pas l'animation), mais avec le slug produit ou la référence.
  const routeKey = segments.join('/') || 'accueil'

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar
        route={route}
        onOpenCart={() => setCartOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
      />
      <main className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={routeKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {view}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} navigate={navigate} />
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} navigate={navigate} />
    </div>
  )
}
