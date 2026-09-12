// Tableau de bord : statistiques clés, mini-graphique des commandes, dernières ventes.

'use client'

import { motion } from 'framer-motion'
import {
  Clock,
  Download,
  ExternalLink,
  Mail,
  Package,
  Plus,
  ShoppingBag,
  Wallet,
} from 'lucide-react'
import { adminApi } from '@/lib/api-client'
import { formatDate, formatPrice } from '@/lib/format'
import { ORDER_STATUSES, type AdminStats, type OrdersByDayPoint } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/shared/spinner'
import { StatusBadge } from '@/components/shared/status-badge'
import { useAdminQuery, type NavigateFn } from './admin-hooks'
import { AdminCard, AdminPageHeader, StatCard, UndeterminedBadge } from './admin-ui'

/** Mini bar-chart en divs (aucune librairie externe). */
function OrdersChart({ points }: { points: OrdersByDayPoint[] }) {
  const max = Math.max(...points.map((point) => point.count), 1)
  const total = points.reduce((sum, point) => sum + point.count, 0)

  if (points.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Aucune donnée sur les 14 derniers jours.
      </p>
    )
  }

  return (
    <div>
      <div className="flex h-32 items-end gap-1 sm:gap-1.5">
        {points.map((point) => {
          const height =
            point.count === 0 ? 2 : Math.max((point.count / max) * 100, 6)
          return (
            <div
              key={point.date}
              className="flex h-full min-w-0 flex-1 flex-col justify-end"
            >
              <div
                className="w-full rounded-t bg-forest-deep transition-colors hover:bg-pine-deep"
                style={{ height: `${height}%` }}
                title={`${point.count} commande(s) le ${point.label}`}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-1 sm:gap-1.5" aria-hidden="true">
        {points.map((point, index) => (
          <span
            key={point.date}
            className="min-w-0 flex-1 truncate text-center text-[10px] text-muted-foreground"
          >
            {index % 2 === 0 ? point.label : ''}
          </span>
        ))}
      </div>
      <p className="mt-2 text-right text-sm text-muted-foreground">
        <span className="font-medium text-forest">{total}</span>{' '}
        commande(s) sur la période
      </p>
    </div>
  )
}

export function DashboardHome({ navigate }: { navigate: NavigateFn }) {
  const statsQuery = useAdminQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
    navigate,
    refetchInterval: 30_000,
  })

  if (statsQuery.isPending) {
    return <Spinner label="Chargement du tableau de bord…" />
  }
  if (statsQuery.error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {statsQuery.error.message}
      </p>
    )
  }

  const stats = statsQuery.data
  const recentOrders = stats.recentOrders.slice(0, 5)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      <AdminPageHeader
        eyebrow="Bonjour,"
        title="Vue d'ensemble"
        description="Activité de la boutique E.T.P.S BELLE ODEUR."
        actions={
          <>
            <Button asChild>
              <a href="#/admin/produits/nouveau">
                <Plus className="size-4" aria-hidden="true" />
                Nouveau parfum
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="#/">
                <ExternalLink className="size-4" aria-hidden="true" />
                Voir la boutique
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/api/telecharger-site" target="_blank" rel="noopener noreferrer">
                <Download className="size-4" aria-hidden="true" />
                Télécharger le site
              </a>
            </Button>
          </>
        }
      />

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard
          icon={Package}
          label="Produits"
          value={stats.productsTotal}
          sub={`${stats.productsAvailable} disponibles · ${stats.productsUnavailable} indisponibles`}
        />
        <StatCard
          icon={ShoppingBag}
          label="Commandes reçues"
          value={stats.ordersTotal}
        />
        <StatCard
          icon={Clock}
          label="En attente"
          value={stats.ordersPending}
          accent
        />
        <StatCard
          icon={Wallet}
          label="Chiffre d'affaires"
          value={formatPrice(stats.revenue) ?? '—'}
          sub={
            stats.revenueUndeterminedCount > 0
              ? `dont ${stats.revenueUndeterminedCount} commande(s) à confirmer`
              : 'Commandes confirmées et livrées'
          }
        />
        <StatCard
          icon={Mail}
          label="Messages non lus"
          value={stats.unreadMessages}
          href="#/admin/messages"
        />
      </div>

      {/* Commandes des 14 derniers jours */}
      <AdminCard className="p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-forest">
          Commandes des 14 derniers jours
        </h2>
        <OrdersChart points={stats.ordersByDay} />
      </AdminCard>

      {/* Répartition par statut */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ORDER_STATUSES.map((status) => (
          <div
            key={status}
            className="flex items-center justify-between gap-2 rounded-xl border bg-white px-4 py-3"
          >
            <StatusBadge status={status} />
            <span className="font-display text-xl font-semibold text-forest">
              {stats.ordersByStatus[status]}
            </span>
          </div>
        ))}
      </div>

      {/* Dernières commandes */}
      <AdminCard className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-forest">
            Dernières commandes
          </h2>
          <a
            href="#/admin/commandes"
            className="text-sm font-medium text-gold-deep transition-colors hover:underline"
          >
            Toutes les commandes →
          </a>
        </div>
        {recentOrders.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aucune commande pour le moment
          </p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <a
                key={order.id}
                href={`#/admin/commandes/${order.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3 transition-colors hover:border-forest/30 hover:bg-cream/60"
              >
                <div className="min-w-0">
                  <p className="font-medium text-forest">{order.reference}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {order.customerName} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatPrice(order.total)}
                    </p>
                    {order.hasUndeterminedPrice ? (
                      <p className="mt-0.5 flex justify-end">
                        <UndeterminedBadge />
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              </a>
            ))}
          </div>
        )}
      </AdminCard>

      {/* Livraison du site */}
      <AdminCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-forest">
              Dossier complet du site
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Archive .zip du site vitrine : code source, images, base de
              données prête pour Neon et guide de démarrage inclus.
            </p>
          </div>
          <Button asChild>
            <a href="/api/telecharger-site" target="_blank" rel="noopener noreferrer">
              <Download className="size-4" aria-hidden="true" />
              Télécharger (.zip)
            </a>
          </Button>
        </div>
      </AdminCard>

    </motion.div>
  )
}
