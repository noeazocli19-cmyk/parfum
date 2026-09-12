'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'etps-belle-odeur-cookie-consent-v1'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [customizeOpen, setCustomizeOpen] = useState(false)

  useEffect(() => {
    const choice = window.localStorage.getItem(STORAGE_KEY)
    setVisible(choice === null)
  }, [])

  const save = (choice: 'accepted' | 'rejected' | 'customized') => {
    window.localStorage.setItem(STORAGE_KEY, choice)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-forest/15 bg-white/95 p-4 shadow-[0_-12px_40px_-18px_rgba(13,39,28,0.35)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl text-sm leading-relaxed text-ink/80">
          <p className="font-medium text-forest">Consentement aux cookies</p>
          <p className="mt-1">
            Ce site utilise uniquement des cookies strictement nécessaires au bon
            fonctionnement du magasin. Vous pouvez accepter, refuser ou personnaliser
            votre choix à tout moment.
          </p>
          <a href="#/politique-utilisation" className="mt-2 inline-block text-forest underline underline-offset-4">
            Voir la politique d’utilisation
          </a>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button onClick={() => save('accepted')} className="bg-forest-deep hover:bg-pine-deep">
            Accepter
          </Button>
          <Button onClick={() => save('rejected')} variant="outline" className="border-forest/30 text-forest hover:bg-cream">
            Refuser
          </Button>
          <Button onClick={() => setCustomizeOpen((value) => !value)} variant="ghost" className="text-forest">
            Personnaliser
          </Button>
        </div>
      </div>

      {customizeOpen ? (
        <div className="mx-auto mt-4 max-w-7xl rounded-xl border border-border bg-cream p-4 text-sm text-ink/80">
          <p className="font-medium text-forest">Cookies</p>
          <div className="mt-2 space-y-2">
            <p>• Cookies strictement nécessaires : activés pour le bon fonctionnement du site.</p>
            <p>• Cookies optionnels : non activés par défaut. Aucun cookie de suivi publicitaire n’est ajouté.</p>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => save('customized')} className="bg-forest-deep hover:bg-pine-deep">
              Enregistrer ma préférence
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
