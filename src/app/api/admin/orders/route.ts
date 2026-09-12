// /api/admin/orders — liste des commandes (session requise).

import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { orderInclude, jsonError } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(req.url)
  const statut = searchParams.get('statut') ?? ''
  const recherche = (searchParams.get('recherche') ?? '').trim()

  const where: Prisma.OrderWhereInput = { AND: [] }
  const and = where.AND as Prisma.OrderWhereInput[]

  if (
    ['NOUVELLE', 'EN_PREPARATION', 'CONFIRMEE', 'LIVREE', 'ANNULEE'].includes(
      statut
    )
  ) {
    and.push({ status: statut })
  }
  if (recherche) {
    and.push({
      OR: [
        { reference: { contains: recherche } },
        { customerName: { contains: recherche } },
        { phone: { contains: recherche } },
      ],
    })
  }

  try {
    const orders = await db.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ orders, total: orders.length })
  } catch {
    return jsonError(500, 'Impossible de charger les commandes.')
  }
}
