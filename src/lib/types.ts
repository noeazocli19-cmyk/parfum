// Types partagés — contrat unique entre le site public, le dashboard et l'API.

export type Category = 'HOMME' | 'FEMME' | 'MIXTE'

export const CATEGORIES: Category[] = ['HOMME', 'FEMME', 'MIXTE']

export const CATEGORY_LABELS: Record<Category, string> = {
  HOMME: 'Parfum Homme',
  FEMME: 'Parfum Femme',
  MIXTE: 'Parfum Mixte',
}

export type OrderStatus =
  | 'NOUVELLE'
  | 'EN_PREPARATION'
  | 'CONFIRMEE'
  | 'LIVREE'
  | 'ANNULEE'

export const ORDER_STATUSES: OrderStatus[] = [
  'NOUVELLE',
  'EN_PREPARATION',
  'CONFIRMEE',
  'LIVREE',
  'ANNULEE',
]

export interface ProductImage {
  id: string
  url: string
  alt: string
  isPrimary: boolean
  sortOrder: number
}

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  notes: string | null
  category: Category
  price: number | null
  stock: number | null
  isAvailable: boolean
  isFeatured: boolean
  isSample: boolean
  createdAt: string
  updatedAt: string
  images: ProductImage[]
}

export interface OrderItem {
  id: string
  productId: string | null
  productName: string
  unitPrice: number
  quantity: number
}

export interface Order {
  id: string
  reference: string
  customerName: string
  phone: string
  address: string
  comment: string | null
  total: number
  hasUndeterminedPrice: boolean
  status: OrderStatus
  createdAt: string
  items: OrderItem[]
}

export type ContactMessageDTO = {
  id: string
  name: string
  phone: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface AdminInfo {
  id: string
  username: string
}

// ─── Réglages du site (modifiables depuis le dashboard) ─────────────────────

export interface SiteSettings {
  heroTitle: string
  heroSubtitle: string
  footerPitch: string
  aboutIntro: string
  aboutStory: string
  aboutValues: string
  aboutVision: string
  contactPhone: string
  contactEmail: string
  contactAddress: string
  socialInstagram: string
  socialFacebook: string
  socialTiktok: string
}

export const SETTING_KEYS: (keyof SiteSettings)[] = [
  'heroTitle',
  'heroSubtitle',
  'footerPitch',
  'aboutIntro',
  'aboutStory',
  'aboutValues',
  'aboutVision',
  'contactPhone',
  'contactEmail',
  'contactAddress',
  'socialInstagram',
  'socialFacebook',
  'socialTiktok',
]

// ─── Statistiques du dashboard ───────────────────────────────────────────────

export interface OrdersByDayPoint {
  date: string // yyyy-mm-dd
  label: string // ex. "12/05"
  count: number
}

export interface AdminStats {
  productsTotal: number
  productsAvailable: number
  productsUnavailable: number
  ordersTotal: number
  ordersPending: number
  ordersByStatus: Record<OrderStatus, number>
  revenue: number
  revenueUndeterminedCount: number // commandes dont le montant reste à confirmer
  unreadMessages: number
  ordersByDay: OrdersByDayPoint[]
  recentOrders: Order[]
}

export interface AdminCustomer {
  name: string
  phone: string
  address: string
  ordersCount: number
  totalSpent: number
  lastOrderAt: string
}

export interface UploadedImage {
  name: string
  url: string
  size: number
  modifiedAt: string
}

// ─── Panier (zustand) ────────────────────────────────────────────────────────

export interface CartItem {
  productId: string
  slug: string
  name: string
  price: number | null
  image: string | null
  category: Category
  isAvailable: boolean
  quantity: number
}

// ─── Routeur (hash) ──────────────────────────────────────────────────────────

export interface Route {
  /** segments du chemin, ex. ['admin','produits'] pour '#/admin/produits' */
  segments: string[]
  query: Record<string, string>
  raw: string
}
