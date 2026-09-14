// Pied de page — collé en bas grâce au conteneur flex du SiteApp.

'use client'

import Image from 'next/image'
import { PhoneCall } from 'lucide-react'
import { telHref } from '@/lib/format'
import { useSettings } from './use-settings'

const FOOTER_LINKS = [
  { label: 'Accueil', href: '#/' },
  { label: 'Boutique', href: '#/boutique' },
  { label: 'Parfums homme', href: '#/boutique?categorie=HOMME' },
  { label: 'Parfums femme', href: '#/boutique?categorie=FEMME' },
  { label: 'À propos', href: '#/a-propos' },
  { label: 'Contact', href: '#/contact' },
]

const LEGAL_LINKS = [
  { label: 'Mention légale', href: '#/mention-legale' },
  { label: 'Politique d’utilisation', href: '#/politique-utilisation' },
  { label: 'Politique générale de vente', href: '#/politique-generale-vente' },
  { label: 'Livraison et retour', href: '#/livraison-retour' },
  { label: 'Politique de remboursement', href: '#/politique-remboursement' },
]

export function Footer() {
  const { settings } = useSettings()
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto bg-forest-deep text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1.2fr] lg:px-8 lg:py-14">
        <div className="flex flex-col gap-4">
          <a href="#/" className="flex items-center gap-3" aria-label="E.T.P.S Belle Odeur — retour à l’accueil">
            <Image
              src="/images/logo.jpg"
              alt="Emblème de la maison E.T.P.S Belle Odeur"
              width={48}
              height={48}
              className="h-12 w-12 rounded-full border border-white/15 object-cover"
            />
            <span className="flex flex-col leading-none">
              <span className="text-[10px] uppercase tracking-[0.35em] text-gold">
                E.T.P.S
              </span>
              <span className="mt-1 font-display text-lg font-semibold leading-none tracking-wide text-white">
                BELLE ODEUR
              </span>
            </span>
          </a>
          <p className="max-w-sm text-sm leading-relaxed text-white/70">
            {settings.footerPitch}
          </p>
        </div>

        <nav aria-label="Navigation du pied de page" className="flex flex-col gap-2.5">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
            Navigation
          </h2>
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="w-fit text-sm text-white/75 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-2.5">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
            Contact
          </h2>
          <a
            href={telHref(settings.contactPhone)}
            className="flex w-fit items-center gap-2.5 text-sm text-white/85 transition-colors hover:text-white"
          >
            <PhoneCall className="size-4 text-gold" aria-hidden="true" />
            {settings.contactPhone}
          </a>
          <p className="max-w-xs text-xs leading-relaxed text-white/55">
            Nos équipes vous conseillent et prennent votre commande par téléphone.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
            Informations légales
          </h2>
          {LEGAL_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="w-fit text-sm text-white/75 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <p className="text-xs text-white/55">
            © {year} E.T.P.S Belle Odeur. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}
