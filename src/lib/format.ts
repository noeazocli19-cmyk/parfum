// Formatage & helpers — utilisés par le site public et le dashboard.

import type { Category, OrderStatus, Product } from '@/lib/types'

/** Formate un prix en francs (fr-FR, suffixe « F »). Renvoie null si pas de prix défini. */
export function formatPrice(price: number | null | undefined): string | null {
  if (price === null || price === undefined) return null
  return `${new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price)} F`
}

/** Date lisible fr-FR. */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

/** Date + heure lisible fr-FR. */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** Transforme un nom en slug URL propre (accents supprimés). */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NOUVELLE: 'Nouvelle',
  EN_PREPARATION: 'En préparation',
  CONFIRMEE: 'Confirmée',
  LIVREE: 'Livrée',
  ANNULEE: 'Annulée',
}

/** Classes de couleurs des badges de statut (palette de la marque). */
export const ORDER_STATUS_CLASSES: Record<OrderStatus, string> = {
  NOUVELLE: 'bg-[#C9A227]/15 text-[#8a6f14] border-[#C9A227]/40',
  EN_PREPARATION: 'bg-[#0B3D2E]/10 text-[#0B3D2E] border-[#0B3D2E]/25',
  CONFIRMEE: 'bg-[#0B3D2E] text-white border-[#0B3D2E]',
  LIVREE: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  ANNULEE: 'bg-stone-100 text-stone-500 border-stone-300',
}

export const CATEGORY_LABELS_SHORT: Record<Category, string> = {
  HOMME: 'Homme',
  FEMME: 'Femme',
  MIXTE: 'Mixte',
}

/** Image principale d'un produit (ou la première). */
export function primaryImage(product: Product): string | null {
  if (!product.images || product.images.length === 0) return null
  const primary = product.images.find((img) => img.isPrimary)
  return (primary ?? product.images[0]).url
}

/** Téléphone au format tel: (supprime espaces/points). */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+0-9]/g, '')}`
}
