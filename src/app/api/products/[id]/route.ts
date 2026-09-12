// /api/products/[id] — GET (public, par id ou slug), PUT/PATCH/DELETE (admin).

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { productInclude, ensureUniqueSlug, normalizeImages, jsonError, readJson } from '@/lib/api-utils'
import { productInputSchema, formatZodError } from '@/lib/validations'

type Params = { params: Promise<{ id: string }> }

async function findProduct(idOrSlug: string) {
  return db.product.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: productInclude,
  })
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const product = await findProduct(id)
    if (!product) return jsonError(404, 'Parfum introuvable.')
    return NextResponse.json({ product })
  } catch {
    return jsonError(500, 'Impossible de charger ce parfum.')
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = await readJson<unknown>(req)
  const parsed = productInputSchema.safeParse(body)
  if (!parsed.success) return jsonError(400, formatZodError(parsed.error))
  const input = parsed.data

  try {
    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) return jsonError(404, 'Parfum introuvable.')

    const slug =
      input.slug === existing.slug
        ? existing.slug
        : await ensureUniqueSlug(input.slug, existing.id)

    const product = await db.product.update({
      where: { id },
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
          deleteMany: {},
          create: normalizeImages(input.images),
        },
      },
      include: productInclude,
    })
    return NextResponse.json({ product })
  } catch {
    return jsonError(500, 'Impossible de modifier ce parfum.')
  }
}

const patchSchema = z.object({
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = await readJson<unknown>(req)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return jsonError(400, 'Données invalides.')

  try {
    const product = await db.product.update({
      where: { id },
      data: parsed.data,
      include: productInclude,
    })
    return NextResponse.json({ product })
  } catch {
    return jsonError(404, 'Parfum introuvable.')
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const { id } = await params
  try {
    await db.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return jsonError(404, 'Parfum introuvable ou déjà supprimé.')
  }
}
