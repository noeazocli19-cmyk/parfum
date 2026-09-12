// Panier — zustand + persistance localStorage.

'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product } from '@/lib/types'

const MAX_QTY = 99

interface CartState {
  items: CartItem[]
  lastAddedAt: number // déclenche l'animation du badge panier
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  clear: () => void
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      lastAddedAt: 0,

      addItem: (product, quantity = 1) =>
        set((state) => {
          if (!product.isAvailable) return state
          const existing = state.items.find(
            (item) => item.productId === product.id
          )
          const items = existing
            ? state.items.map((item) =>
                item.productId === product.id
                  ? {
                      ...item,
                      quantity: Math.min(MAX_QTY, item.quantity + quantity),
                    }
                  : item
              )
            : [
                ...state.items,
                {
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  image: product.images?.[0]?.url ?? null,
                  category: product.category,
                  isAvailable: product.isAvailable,
                  quantity: Math.min(MAX_QTY, Math.max(1, quantity)),
                },
              ]
          return { items, lastAddedAt: Date.now() }
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),

      setQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.productId !== productId)
              : state.items.map((item) =>
                  item.productId === productId
                    ? { ...item, quantity: Math.min(MAX_QTY, quantity) }
                    : item
                ),
        })),

      clear: () => set({ items: [], lastAddedAt: 0 }),
    }),
    {
      name: 'bo-cart-v1',
    }
  )
)

/** Nombre total d'articles dans le panier. */
export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

/** Sous-total du panier (les articles sans prix comptent 0 — "sur demande"). */
export function cartSubtotal(items: CartItem[]): number {
  return items.reduce(
    (sum, item) => sum + (item.price ?? 0) * item.quantity,
    0
  )
}

/** Le panier contient-il au moins un produit "prix sur demande" ? */
export function cartHasUndeterminedPrice(items: CartItem[]): boolean {
  return items.some((item) => item.price === null)
}
