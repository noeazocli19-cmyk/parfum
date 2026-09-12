// Détail d'une commande : articles, client, changement de statut, suppression.

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Phone, Trash2 } from 'lucide-react'
import { adminApi } from '@/lib/api-client'
import { formatDateTime, formatPrice, telHref } from '@/lib/format'
import { ORDER_STATUSES, type OrderStatus } from '@/lib/types'
import { ORDER_STATUS_LABELS } from '@/lib/format'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Spinner } from '@/components/shared/spinner'
import { StatusBadge } from '@/components/shared/status-badge'
import {
  handleMutationError,
  useAdminQuery,
  type NavigateFn,
} from './admin-hooks'
import { AdminCard, AdminPageHeader, ConfirmDialog } from './admin-ui'

export function OrderDetailPage({
  orderId,
  navigate,
}: {
  orderId: string
  navigate: NavigateFn
}) {
  const queryClient = useQueryClient()

  const orderQuery = useAdminQuery({
    queryKey: ['admin-order', orderId],
    queryFn: () => adminApi.getOrder(orderId),
    navigate,
  })
  const order = orderQuery.data?.order

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => adminApi.updateOrderStatus(orderId, status),
    onSuccess: () => {
      toast.success('Statut mis à jour')
      void queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] })
      void queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: (error) => handleMutationError(error, navigate),
  })

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteOrder(orderId),
    onSuccess: () => {
      toast.success('Commande supprimée')
      void queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      navigate('#/admin/commandes')
    },
    onError: (error) => handleMutationError(error, navigate),
  })

  if (orderQuery.isPending) {
    return <Spinner label="Chargement de la commande…" />
  }
  if (orderQuery.error || !order) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {orderQuery.error?.message ?? 'Commande introuvable.'}
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <AdminPageHeader
          backHref="#/admin/commandes"
          backLabel="Toutes les commandes"
          eyebrow="Ventes"
          title={`Commande ${order.reference}`}
        />
        <div className="-mt-3 flex flex-wrap items-center gap-3">
          <StatusBadge status={order.status} />
          <span className="text-sm text-muted-foreground">
            Passée le {formatDateTime(order.createdAt)}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Colonne principale */}
        <div className="space-y-6">
          <AdminCard className="p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-forest">
              Articles commandés
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Prix unitaire</TableHead>
                  <TableHead className="text-center">Quantité</TableHead>
                  <TableHead className="text-right">Total ligne</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {formatPrice(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="whitespace-nowrap text-right font-medium">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">Sous-total</span>
              <span className="font-display text-xl font-semibold text-forest">
                {formatPrice(order.total)}
              </span>
            </div>
            {order.hasUndeterminedPrice ? (
              <div className="mt-4 rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm text-forest">
                Cette commande contient un produit « prix sur demande » : le montant
                définitif sera confirmé avec le client par téléphone.
              </div>
            ) : null}
          </AdminCard>

          {order.comment ? (
            <AdminCard className="p-6">
              <h2 className="mb-2 font-display text-lg font-semibold text-forest">
                Commentaire du client
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed">
                {order.comment}
              </p>
            </AdminCard>
          ) : null}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          <AdminCard className="p-6">
            <h2 className="font-display text-lg font-semibold text-forest">Client</h2>
            <p className="mt-3 font-medium">{order.customerName}</p>
            <a
              href={telHref(order.phone)}
              className="mt-0.5 block text-sm text-muted-foreground transition-colors hover:text-forest hover:underline"
            >
              {order.phone}
            </a>
            <Button variant="outline" size="sm" asChild className="mt-3">
              <a href={telHref(order.phone)}>
                <Phone className="size-4" aria-hidden="true" />
                Appeler
              </a>
            </Button>
            <Separator className="my-4" />
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Adresse de livraison
            </p>
            <p className="mt-1 whitespace-pre-line text-sm">{order.address}</p>
            <Separator className="my-4" />
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Date de commande
            </p>
            <p className="mt-1 text-sm">{formatDateTime(order.createdAt)}</p>
          </AdminCard>

          <AdminCard className="p-6">
            <h2 className="font-display text-lg font-semibold text-forest">Statut</h2>
            <Select
              value={order.status}
              onValueChange={(value) => statusMutation.mutate(value as OrderStatus)}
            >
              <SelectTrigger
                className="mt-3 w-full"
                aria-label="Changer le statut de la commande"
                disabled={statusMutation.isPending}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {ORDER_STATUS_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              {statusMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  Mise à jour en cours…
                </>
              ) : (
                <span>Statut actuel : {ORDER_STATUS_LABELS[order.status]}</span>
              )}
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <h2 className="font-display text-lg font-semibold text-forest">Actions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              La suppression d&apos;une commande est définitive.
            </p>
            <ConfirmDialog
              trigger={
                <Button
                  variant="destructive"
                  className="mt-4 w-full"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="size-4" aria-hidden="true" />
                  )}
                  Supprimer la commande
                </Button>
              }
              title="Supprimer cette commande ?"
              description="Action définitive. La commande sera définitivement supprimée."
              confirmLabel="Supprimer définitivement"
              onConfirm={() => deleteMutation.mutate()}
            />
          </AdminCard>
        </div>
      </div>
    </div>
  )
}
