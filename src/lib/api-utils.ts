// Utilitaires serveur pour les routes API.

import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status })
}

/** Lit un corps JSON en tolérant les corps invalides. */
export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}

/** Include Prisma standard pour les produits. */
export const productInclude = {
  images: {
    orderBy: { sortOrder: 'asc' as const },
  },
} satisfies Prisma.ProductInclude

/** Include Prisma standard pour les commandes. */
export const orderInclude = {
  items: true,
} satisfies Prisma.OrderInclude

/** Garantit un slug unique (en suffixant -2, -3… si nécessaire). */
export async function ensureUniqueSlug(
  base: string,
  ignoreId?: string
): Promise<string> {
  let candidate = base
  let i = 2
  for (;;) {
    const existing = await db.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
    if (!existing || existing.id === ignoreId) return candidate
    candidate = `${base}-${i++}`
  }
}

export interface NormalizedImage {
  url: string
  alt: string
  isPrimary: boolean
  sortOrder: number
}

/** Normalise la liste d'images : ordre = index, une seule image principale. */
export function normalizeImages(
  images: { url: string; alt?: string; isPrimary?: boolean }[]
): NormalizedImage[] {
  const firstPrimary = images.findIndex((img) => img.isPrimary)
  return images.map((img, index) => ({
    url: img.url,
    alt: img.alt ?? '',
    isPrimary:
      firstPrimary === -1
        ? index === 0
        : index === firstPrimary,
    sortOrder: index,
  }))
}
