// Client API — appelé depuis le navigateur (site public + dashboard).
// Tous les appels sont relative-path, same-origin.

import type {
  AdminCustomer,
  AdminInfo,
  AdminStats,
  Category,
  ContactMessageDTO,
  Order,
  OrderStatus,
  Product,
  SiteSettings,
  UploadedImage,
} from '@/lib/types'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
    credentials: 'same-origin',
  })
  const data = (await res.json().catch(() => null)) as
    | (T & { error?: string })
    | null
  if (!res.ok) {
    throw new ApiError(
      data?.error || 'Une erreur est survenue. Veuillez réessayer.',
      res.status
    )
  }
  return data as T
}

// ─── Public ──────────────────────────────────────────────────────────────────

export interface ProductFilters {
  categorie?: Category | ''
  recherche?: string
  disponible?: boolean
  vedette?: boolean
  tri?: 'recent' | 'prix_asc' | 'prix_desc'
  excludeId?: string
}

function productsQueryString(filters: ProductFilters): string {
  const params = new URLSearchParams()
  if (filters.categorie) params.set('categorie', filters.categorie)
  if (filters.recherche) params.set('recherche', filters.recherche)
  if (filters.disponible) params.set('disponible', 'true')
  if (filters.vedette) params.set('vedette', 'true')
  if (filters.tri) params.set('tri', filters.tri)
  if (filters.excludeId) params.set('excludeId', filters.excludeId)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const api = {
  getProducts: (filters: ProductFilters = {}) =>
    request<{ products: Product[]; total: number }>(
      `/api/products${productsQueryString(filters)}`
    ),

  getProduct: (idOrSlug: string) =>
    request<{ product: Product }>(`/api/products/${encodeURIComponent(idOrSlug)}`),

  getSettings: () => request<SiteSettings>('/api/settings'),

  createOrder: (input: {
    customerName: string
    phone: string
    address: string
    comment?: string
    items: { productId: string; quantity: number }[]
  }) =>
    request<{ reference: string }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  sendContact: (input: { name: string; phone: string; message: string }) =>
    request<{ ok: true }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  // ─── Auth ──────────────────────────────────────────────────────────────────

  login: (username: string, password: string) =>
    request<{ admin: AdminInfo }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST' }),

  me: () => request<{ admin: AdminInfo | null }>('/api/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: true }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
}

// ─── Administration (session requise) ────────────────────────────────────────

export interface ProductInputDTO {
  name: string
  slug: string
  description: string
  notes?: string | null
  category: Category
  price: number | null
  stock: number | null
  isAvailable: boolean
  isFeatured: boolean
  images: { url: string; alt: string; isPrimary: boolean }[]
}

export const adminApi = {
  getStats: () => request<AdminStats>('/api/admin/stats'),

  listOrders: (params: { statut?: OrderStatus | ''; recherche?: string } = {}) => {
    const qs = new URLSearchParams()
    if (params.statut) qs.set('statut', params.statut)
    if (params.recherche) qs.set('recherche', params.recherche)
    const query = qs.toString()
    return request<{ orders: Order[]; total: number }>(
      `/api/admin/orders${query ? `?${query}` : ''}`
    )
  },

  getOrder: (id: string) =>
    request<{ order: Order }>(`/api/admin/orders/${encodeURIComponent(id)}`),

  updateOrderStatus: (id: string, status: OrderStatus) =>
    request<{ order: Order }>(`/api/admin/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteOrder: (id: string) =>
    request<{ ok: true }>(`/api/admin/orders/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  saveProduct: (input: ProductInputDTO, id?: string) =>
    request<{ product: Product }>(
      id ? `/api/products/${encodeURIComponent(id)}` : '/api/products',
      {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(input),
      }
    ),

  deleteProduct: (id: string) =>
    request<{ ok: true }>(`/api/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  patchProduct: (
    id: string,
    patch: { isAvailable?: boolean; isFeatured?: boolean }
  ) =>
    request<{ product: Product }>(`/api/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  getMessages: () =>
    request<{ messages: ContactMessageDTO[] }>('/api/admin/messages'),

  markMessage: (id: string, isRead: boolean) =>
    request<{ message: ContactMessageDTO }>(
      `/api/admin/messages/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify({ isRead }) }
    ),

  deleteMessage: (id: string) =>
    request<{ ok: true }>(`/api/admin/messages/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  updateSettings: (values: Partial<Record<keyof SiteSettings, string>>) =>
    request<{ settings: SiteSettings }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(values),
    }),

  uploadImage: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<{ url: string }>('/api/upload', {
      method: 'POST',
      body: form,
    })
  },

  listUploads: () => request<{ images: UploadedImage[] }>('/api/admin/uploads'),

  deleteUpload: (name: string) =>
    request<{ ok: true }>(
      `/api/admin/uploads?name=${encodeURIComponent(name)}`,
      { method: 'DELETE' }
    ),

  getCustomers: () =>
    request<{ customers: AdminCustomer[] }>('/api/admin/customers'),
}
