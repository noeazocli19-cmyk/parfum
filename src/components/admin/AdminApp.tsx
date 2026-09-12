// Point d'entrée du dashboard : garde de session + routage des vues administrateur.

'use client'

import { useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { AdminInfo, Route } from '@/lib/types'
import { Spinner } from '@/components/shared/spinner'
import type { NavigateFn } from './admin-hooks'
import { AdminShell } from './AdminShell'
import { LoginPage } from './LoginPage'
import { DashboardHome } from './DashboardHome'
import { ProductsPage } from './ProductsPage'
import { ProductFormPage } from './ProductFormPage'
import { OrdersPage } from './OrdersPage'
import { OrderDetailPage } from './OrderDetailPage'
import { MessagesPage } from './MessagesPage'
import { CustomersPage } from './CustomersPage'
import { UploadsPage } from './UploadsPage'
import { SettingsPage } from './SettingsPage'

/** segments de l'admin (après « admin ») : [] → dashboard, ['produits']… */
function renderView(seg: string[], navigate: NavigateFn, admin: AdminInfo): ReactNode {
  const [head, second] = seg
  switch (head) {
    case 'produits':
      if (second === 'nouveau') {
        return <ProductFormPage key="nouveau" navigate={navigate} />
      }
      if (second) {
        return <ProductFormPage key={second} productId={second} navigate={navigate} />
      }
      return <ProductsPage navigate={navigate} />
    case 'commandes':
      if (second) {
        return <OrderDetailPage key={second} orderId={second} navigate={navigate} />
      }
      return <OrdersPage navigate={navigate} />
    case 'messages':
      return <MessagesPage navigate={navigate} />
    case 'clients':
      return <CustomersPage navigate={navigate} />
    case 'images':
      return <UploadsPage navigate={navigate} />
    case 'parametres':
      return <SettingsPage admin={admin} navigate={navigate} />
    default:
      return <DashboardHome navigate={navigate} />
  }
}

export function AdminApp({
  route,
  navigate,
}: {
  route: Route
  navigate: (to: string, options?: { replace?: boolean }) => void
}) {
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: api.me,
    staleTime: 60_000,
  })
  const admin = meQuery.data?.admin ?? null
  const seg = route.segments[0] === 'admin' ? route.segments.slice(1) : []
  const isLoginRoute = seg.length === 1 && seg[0] === 'connexion'

  useEffect(() => {
    if (meQuery.isLoading) return
    if (!admin && !isLoginRoute) {
      navigate('#/admin/connexion', { replace: true })
    } else if (admin && isLoginRoute) {
      navigate('#/admin')
    }
  }, [meQuery.isLoading, admin, isLoginRoute, navigate])

  if (meQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-4">
        <Spinner label="Chargement de l'espace d'administration…" />
      </div>
    )
  }

  if (!admin) {
    return isLoginRoute ? <LoginPage navigate={navigate} /> : null
  }

  if (isLoginRoute) return null

  return (
    <AdminShell route={route} navigate={navigate} admin={admin}>
      {renderView(seg, navigate, admin)}
    </AdminShell>
  )
}
