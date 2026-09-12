// /api/admin/stats — statistiques du tableau de bord (session requise).

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { jsonError } from '@/lib/api-utils'
import { orderInclude } from '@/lib/api-utils'
import type { AdminStats, OrdersByDayPoint, OrderStatus } from '@/lib/types'

const DAY_MS = 24 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  try {
    const [productsTotal, productsAvailable, ordersByStatusRaw, revenueAgg, revenueUndetermined, unreadMessages, recentOrdersRaw] =
      await Promise.all([
        db.product.count(),
        db.product.count({ where: { isAvailable: true } }),
        db.order.groupBy({ by: ['status'], _count: { _all: true } }),
        db.order.aggregate({
          _sum: { total: true },
          where: { status: { not: 'ANNULEE' } },
        }),
        db.order.count({
          where: { hasUndeterminedPrice: true, status: { not: 'ANNULEE' } },
        }),
        db.contactMessage.count({ where: { isRead: false } }),
        db.order.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: orderInclude,
        }),
      ])

    const ordersTotal = ordersByStatusRaw.reduce(
      (sum, group) => sum + group._count._all,
      0
    )

    const ordersByStatus: Record<OrderStatus, number> = {
      NOUVELLE: 0,
      EN_PREPARATION: 0,
      CONFIRMEE: 0,
      LIVREE: 0,
      ANNULEE: 0,
    }
    for (const group of ordersByStatusRaw) {
      if (group.status in ordersByStatus) {
        ordersByStatus[group.status as OrderStatus] = group._count._all
      }
    }

    // Commandes des 14 derniers jours (hors annulées) pour le mini-graphique.
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const since = new Date(start.getTime() - 13 * DAY_MS)
    const recentAll = await db.order.findMany({
      where: { createdAt: { gte: since }, status: { not: 'ANNULEE' } },
      select: { createdAt: true },
    })
    const dayMap = new Map<string, number>()
    for (const order of recentAll) {
      const key = order.createdAt.toISOString().slice(0, 10)
      dayMap.set(key, (dayMap.get(key) ?? 0) + 1)
    }
    const ordersByDay: OrdersByDayPoint[] = []
    for (let i = 0; i < 14; i++) {
      const date = new Date(since.getTime() + i * DAY_MS)
      const key = date.toISOString().slice(0, 10)
      ordersByDay.push({
        date: key,
        label: date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
        }),
        count: dayMap.get(key) ?? 0,
      })
    }

    const stats: AdminStats = {
      productsTotal,
      productsAvailable,
      productsUnavailable: productsTotal - productsAvailable,
      ordersTotal,
      ordersPending: ordersByStatus.NOUVELLE + ordersByStatus.EN_PREPARATION,
      ordersByStatus,
      revenue: revenueAgg._sum.total ?? 0,
      revenueUndeterminedCount: revenueUndetermined,
      unreadMessages,
      ordersByDay,
      recentOrders: recentOrdersRaw.map((order) => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      })) as AdminStats['recentOrders'],
    }

    return NextResponse.json(stats)
  } catch {
    return jsonError(500, 'Impossible de charger les statistiques.')
  }
}
