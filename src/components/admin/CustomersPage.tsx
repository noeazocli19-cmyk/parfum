// Clients déduits des commandes : coordonnées, fréquence, montant dépensé.

'use client'

import { Phone, Users } from 'lucide-react'
import { adminApi } from '@/lib/api-client'
import { formatDate, formatPrice, telHref } from '@/lib/format'
import type { AdminCustomer } from '@/lib/types'
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
import { useAdminQuery, type NavigateFn } from './admin-hooks'
import { AdminPageHeader } from './admin-ui'

function CustomerCard({ customer }: { customer: AdminCustomer }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-forest">{customer.name}</p>
        <span className="text-xs text-muted-foreground">
          {customer.ordersCount} commande{customer.ordersCount > 1 ? 's' : ''}
        </span>
      </div>
      <a
        href={telHref(customer.phone)}
        className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-forest hover:underline"
      >
        <Phone className="size-3.5" aria-hidden="true" />
        {customer.phone}
      </a>
      <p className="mt-1 truncate text-sm text-muted-foreground" title={customer.address}>
        {customer.address}
      </p>
      <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm">
        <span className="text-muted-foreground">
          Dernière commande : {formatDate(customer.lastOrderAt)}
        </span>
        <span className="font-medium">{formatPrice(customer.totalSpent)}</span>
      </div>
    </div>
  )
}

export function CustomersPage({ navigate }: { navigate: NavigateFn }) {
  const customersQuery = useAdminQuery({
    queryKey: ['admin-customers'],
    queryFn: () => adminApi.getCustomers(),
    navigate,
  })
  const customers = customersQuery.data?.customers ?? []

  return (
    <div>
      <AdminPageHeader
        eyebrow="Relation client"
        title="Clients"
        description="Clients déduits des commandes enregistrées."
      />

      {customersQuery.isPending ? (
        <Spinner label="Chargement des clients…" />
      ) : customersQuery.error ? (
        <p className="text-sm text-destructive" role="alert">
          {customersQuery.error.message}
        </p>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun client pour le moment"
          description="Les clients apparaîtront dès la première commande enregistrée."
        />
      ) : (
        <>
          {/* Vue tableau (desktop) */}
          <div className="hidden rounded-xl border bg-white md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead className="text-right">Commandes</TableHead>
                  <TableHead className="text-right">Total dépensé</TableHead>
                  <TableHead>Dernière commande</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={`${customer.name}-${customer.phone}`}>
                    <TableCell className="font-medium text-forest">
                      {customer.name}
                    </TableCell>
                    <TableCell>
                      <a
                        href={telHref(customer.phone)}
                        className="text-sm transition-colors hover:text-forest hover:underline"
                      >
                        {customer.phone}
                      </a>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span className="block truncate text-sm text-muted-foreground" title={customer.address}>
                        {customer.address}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {customer.ordersCount}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(customer.totalSpent)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(customer.lastOrderAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Vue cartes (mobile) */}
          <div className="space-y-3 md:hidden">
            {customers.map((customer) => (
              <CustomerCard key={`${customer.name}-${customer.phone}`} customer={customer} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
