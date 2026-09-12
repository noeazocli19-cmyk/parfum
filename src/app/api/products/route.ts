// /api/products — GET liste publique filtrable, POST création (admin).

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { productInclude, ensureUniqueSlug, normalizeImages, jsonError, readJson } from '@/lib/api-utils'
import { productInputSchema, formatZodError } from '@/lib/validations'
import type { Prisma } from '@prisma/client'
import type { Category } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categorie = searchParams.get('categorie') ?? ''
  const recherche = (searchParams.get('recherche') ?? '').trim()
  const disponible = searchParams.get('disponible') === 'true'
  const vedette = searchParams.get('vedette') === 'true'
  const tri = searchParams.get('tri') ?? 'recent'
  const excludeId = searchParams.get('excludeId') ?? ''

  const where: Prisma.ProductWhereInput = { AND: [] }
  const and = where.AND as Prisma.ProductWhereInput[]

  if (['HOMME', 'FEMME', 'MIXTE'].includes(categorie)) {
    and.push({ category: categorie as Category })
  }
  if (recherche) {
    and.push({
      OR: [
        { name: { contains: recherche } },
        { description: { contains: recherche } },
      ],
    })
  }
  if (disponible) and.push({ isAvailable: true })
  if (vedette) and.push({ isFeatured: true })
  if (excludeId) and.push({ id: { not: excludeId } })

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }
  if (tri === 'prix_asc') orderBy = { price: 'asc' }
  if (tri === 'prix_desc') orderBy = { price: 'desc' }

  try {
    const products = await db.product.findMany({
      where,
      include: productInclude,
      orderBy,
    })
    return NextResponse.json({ products, total: products.length })
  } catch {
    return jsonError(500, 'Impossible de charger les parfums.')
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const body = await readJson<unknown>(req)
  const parsed = productInputSchema.safeParse(body)
  if (!parsed.success) {
    return jsonError(400, formatZodError(parsed.error))
  }
  const input = parsed.data

  try {
    const slug = await ensureUniqueSlug(input.slug)
    const product = await db.product.create({
      data: {
        slug,
        name: input.name,
        description: input.description,
        notes: input.notes ?? null,
        category: input.category,
        price: input.price,
        stock: input.stock,
        isAvailable: input.isAvailable,
        isFeatured: input.isFeatured,
        images: {
          create: normalizeImages(input.images),
        },
      },
      include: productInclude,
    })
    return NextResponse.json({ product }, { status: 201 })
  } catch {
    return jsonError(500, 'Impossible de créer le parfum.')
  }
}
