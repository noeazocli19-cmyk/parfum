// Valeurs par défaut des réglages du site (contenus provisoires clairement
// identifiés — modifiables depuis le dashboard administrateur).

import type { SiteSettings } from '@/lib/types'

export const DEFAULT_SETTINGS: SiteSettings = {
  heroTitle: 'Des parfums choisis avec soin',
  heroSubtitle:
    "E.T.P.S Belle Odeur — une sélection de parfums pour homme et femme, pensée pour chaque personnalité.",
  footerPitch:
    'Maison spécialisée dans la vente de parfums pour homme et femme.',
  aboutIntro:
    "E.T.P.S Belle Odeur est une maison dédiée à la vente de parfums.\n\n(Texte provisoire — les informations officielles seront ajoutées prochainement.)",
  aboutStory:
    "Notre univers : la passion du parfum et l'art de plaire.\n\n(Texte provisoire — en attente des informations officielles de l'entreprise.)",
  aboutValues:
    'Exigence · Élégance · Confiance\n\n(Valeurs provisoires — modifiables depuis le tableau de bord.)',
  aboutVision:
    "(Texte provisoire — la vision de l'entreprise sera communiquée prochainement.)",
  contactPhone: '01 66 49 12 98',
  contactEmail: '',
  contactAddress: '',
  socialInstagram: '',
  socialFacebook: '',
  socialTiktok: '',
}

export const PROVISIONAL_SETTINGS_KEYS: (keyof SiteSettings)[] = [
  'heroTitle',
  'heroSubtitle',
  'footerPitch',
  'aboutIntro',
  'aboutStory',
  'aboutValues',
  'aboutVision',
]
