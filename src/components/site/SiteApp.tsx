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
import { CookieConsent } from './CookieConsent'
import { LegalPage } from './views/LegalPage'

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
      case 'mention-legale':
        return (
          <LegalPage
            title="Mention légale"
            intro="Informations légales nécessaires à la transparence de la boutique et à la conformité de l’activité en ligne."
            sections={[
              {
                title: 'Éditeur du site',
                body: (
                  <>
                    <p>E.T.P.S Belle Odeur est la société éditrice du site vitrine.</p>
                    <p>Les informations officielles complètes doivent être confirmées par la boutique avant publication définitive.</p>
                  </>
                ),
              },
              {
                title: 'Responsable de la publication',
                body: (
                  <>
                    <p>Le responsable de la publication est la boutique E.T.P.S Belle Odeur.</p>
                    <p>À compléter avec les informations légales exactes de l’établissement si nécessaire.</p>
                  </>
                ),
              },
            ]}
          />
        )
      case 'politique-utilisation':
        return (
          <LegalPage
            title="Politique d’utilisation"
            intro="Cette politique décrit le cadre d’utilisation du site et les règles applicables à l’achat et à la navigation sur le catalogue."
            sections={[
              {
                title: 'Utilisation du site',
                body: (
                  <>
                    <p>Le site est destiné à présenter les produits, informer les clients et faciliter les commandes.</p>
                    <p>Les contenus du site ne doivent pas être utilisés à des fins illicites, abusives ou contraires aux lois en vigueur.</p>
                  </>
                ),
              },
              {
                title: 'Contenu et informations',
                body: (
                  <>
                    <p>Les informations produit, prix et disponibilités peuvent être mises à jour par la boutique.</p>
                    <p>Les contenus indiqués sont destinés à l’information du client et peuvent évoluer.</p>
                  </>
                ),
              },
            ]}
          />
        )
      case 'politique-generale-vente':
        return (
          <LegalPage
            title="Politique générale de vente"
            intro="Cette politique vise à informer le client sur les règles applicables aux achats réalisés sur le site."
            sections={[
              {
                title: 'Commandes',
                body: (
                  <>
                    <p>Les commandes sont établies sur la base des produits visibles sur le site et peuvent être confirmées par la boutique.</p>
                    <p>Les informations de commande sont vérifiées par téléphone ou via le canal de communication sélectionné.</p>
                  </>
                ),
              },
              {
                title: 'Disponibilité',
                body: (
                  <>
                    <p>Les produits peuvent être en quantité limitée ou temporairement indisponibles.</p>
                    <p>La boutique se réserve le droit de confirmer ou d’annuler une commande selon la disponibilité réelle du stock.</p>
                  </>
                ),
              },
            ]}
          />
        )
      case 'livraison-retour':
        return (
          <LegalPage
            title="Livraison et retour"
            intro="Les informations ci-dessous constituent une politique claire et professionnelle de livraison et d’échange."
            sections={[
              {
                title: 'Livraison',
                body: (
                  <>
                    <p>Après le passage de la commande, E.T.P.S Belle Odeur dispose d’un délai pouvant aller jusqu’à 3 jours pour effectuer la livraison.</p>
                    <p>Le délai effectif peut varier selon la zone de livraison et les disponibilités.</p>
                  </>
                ),
              },
              {
                title: 'Retour / échange',
                body: (
                  <>
                    <p>Si le client n’est pas satisfait du produit ou si une erreur s’est produite concernant sa commande, il dispose de 48 heures pour contacter la boutique afin de demander un échange ou un retour.</p>
                    <p>Pour initier une demande, le client doit contacter la boutique via le numéro ou le formulaire de contact du site.</p>
                  </>
                ),
              },
            ]}
          />
        )
      case 'politique-remboursement':
        return (
          <LegalPage
            title="Politique de remboursement"
            intro="Lorsque le retour est accepté conformément aux conditions prévues par la boutique, le client peut demander un remboursement selon les modalités applicables."
            sections={[
              {
                title: 'Remboursement',
                body: (
                  <>
                    <p>Le remboursement est étudié au cas par cas selon la validation du retour par la boutique.</p>
                    <p>Les modalités exactes et les moyens de remboursement seront communiqués par la boutique lors de l’examen de la demande.</p>
                    <p>Veuillez contacter la boutique pour obtenir les détails précis avant toute demande.</p>
                  </>
                ),
              },
            ]}
          />
        )
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
      <CookieConsent />
    </div>
  )
}
