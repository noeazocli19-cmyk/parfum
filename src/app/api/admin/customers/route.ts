// /api/admin/customers — clients dérivés des commandes (session requise).

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { jsonError } from '@/lib/api-utils'
import type { AdminCustomer } from '@/lib/types'

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  try {
    const orders = await db.order.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        customerName: true,
        phone: true,
        address: true,
        total: true,
        status: true,
        createdAt: true,
      },
    })

    const byPhone = new Map<string, AdminCustomer>()
    for (const order of orders) {
      const phoneKey = order.phone.replace(/[^0-9+]/g, '')
      if (!phoneKey) continue
      const spent = order.status === 'ANNULEE' ? 0 : order.total
      const existing = byPhone.get(phoneKey)
      if (existing) {
        existing.ordersCount += 1
        existing.totalSpent += spent
      } else {
        byPhone.set(phoneKey, {
          name: order.customerName,
          phone: order.phone,
          address: order.address,
          ordersCount: 1,
          totalSpent: spent,
          lastOrderAt: order.createdAt.toISOString(),
        })
      }
    }

    const customers = [...byPhone.values()].sort((a, b) =>
      b.lastOrderAt.localeCompare(a.lastOrderAt)
    )
    return NextResponse.json({ customers })
  } catch {
    return jsonError(500, 'Impossible de charger les clients.')
  }
}
