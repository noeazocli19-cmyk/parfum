// Liste des commandes : filtre par statut, recherche debouncée, vue tableau/cartes.

'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Search, ShoppingBag } from 'lucide-react'
import { adminApi } from '@/lib/api-client'
import { formatDateTime, formatPrice } from '@/lib/format'
import { ORDER_STATUSES, type Order, type OrderStatus } from '@/lib/types'
import { ORDER_STATUS_LABELS } from '@/lib/format'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { Spinner } from '@/components/shared/spinner'
import { StatusBadge } from '@/components/shared/status-badge'
import { useAdminQuery, type NavigateFn } from './admin-hooks'
import { AdminPageHeader, UndeterminedBadge } from './admin-ui'

type StatusFilter = OrderStatus | 'ALL'

function firstItemLabel(order: Order): string | null {
  if (order.items.length === 0) return null
  const suffix = order.items.length > 1 ? '…' : ''
  return `${order.items[0].productName}${suffix}`
}

export function OrdersPage({ navigate }: { navigate: NavigateFn }) {
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  // Recherche debouncée (300 ms) pour limiter les requêtes.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const ordersQuery = useAdminQuery({
    queryKey: ['admin-orders', status, search],
    queryFn: () =>
      adminApi.listOrders({
        statut: status === 'ALL' ? '' : status,
        recherche: search || undefined,
      }),
    navigate,
  })

  const orders = useMemo(() => ordersQuery.data?.orders ?? [], [ordersQuery.data])
  const total = ordersQuery.data?.total ?? 0

  return (
    <div>
      <AdminPageHeader
        eyebrow="Ventes"
        title="Commandes"
        description="Suivez et traitez les commandes de la boutique."
      />

      {/* Filtres */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as StatusFilter)}
        >
          <SelectTrigger className="w-full sm:w-[190px]" aria-label="Filtrer par statut">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toutes</SelectItem>
            {ORDER_STATUSES.map((item) => (
              <SelectItem key={item} value={item}>
                {ORDER_STATUS_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 sm:min-w-[240px]">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Rechercher (référence, client, téléphone)…"
            className="pl-9"
            aria-label="Rechercher une commande"
          />
        </div>
      </div>

      {!ordersQuery.isPending ? (
        <p className="mb-3 text-sm text-muted-foreground">
          {total} commande{total > 1 ? 's' : ''}
        </p>
      ) : null}

      {ordersQuery.isPending ? (
        <Spinner label="Chargement des commandes…" />
      ) : ordersQuery.error ? (
        <p className="text-sm text-destructive" role="alert">
          {ordersQuery.error.message}
        </p>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Aucune commande"
          description="Les commandes passées sur la boutique apparaîtront ici."
        />
      ) : (
        <>
          {/* Vue tableau (desktop) */}
          <div className="hidden rounded-xl border bg-white md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>
                    <span className="sr-only">Détail</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`#/admin/commandes/${order.id}`)}
                  >
                    <TableCell>
                      <a
                        href={`#/admin/commandes/${order.id}`}
                        className="font-medium text-forest hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {order.reference}
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-xs text-muted-foreground">{order.phone}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDateTime(order.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span>
                        {order.items.length} article
                        {order.items.length > 1 ? 's' : ''}
                      </span>
                      {firstItemLabel(order) ? (
                        <div className="max-w-[180px] truncate text-xs text-muted-foreground">
                          {firstItemLabel(order)}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{formatPrice(order.total)}</div>
                      {order.hasUndeterminedPrice ? (
                        <div className="mt-0.5">
                          <UndeterminedBadge />
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      <ChevronRight
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Vue cartes (mobile) */}
          <div className="space-y-3 md:hidden">
            {orders.map((order) => (
              <a
                key={order.id}
                href={`#/admin/commandes/${order.id}`}
                className="block rounded-xl border bg-white p-4 transition-colors hover:border-forest/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-forest">{order.reference}</span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-1 text-sm">{order.customerName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(order.createdAt)}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {order.items.length} article{order.items.length > 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{formatPrice(order.total)}</span>
                    {order.hasUndeterminedPrice ? <UndeterminedBadge /> : null}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
