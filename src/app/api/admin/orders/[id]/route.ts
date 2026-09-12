// /api/admin/orders/[id] — détail, changement de statut, suppression.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { orderInclude, jsonError, readJson } from '@/lib/api-utils'
import { orderStatusSchema, formatZodError } from '@/lib/validations'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const { id } = await params
  try {
    const order = await db.order.findUnique({
      where: { id },
      include: orderInclude,
    })
    if (!order) return jsonError(404, 'Commande introuvable.')
    return NextResponse.json({ order })
  } catch {
    return jsonError(500, 'Impossible de charger cette commande.')
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = await readJson<unknown>(req)
  const parsed = orderStatusSchema.safeParse(body)
  if (!parsed.success) return jsonError(400, formatZodError(parsed.error))

  try {
    const order = await db.order.update({
      where: { id },
      data: { status: parsed.data.status },
      include: orderInclude,
    })
    return NextResponse.json({ order })
  } catch {
    return jsonError(404, 'Commande introuvable.')
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const { id } = await params
  try {
    await db.order.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return jsonError(404, 'Commande introuvable ou déjà supprimée.')
  }
}
