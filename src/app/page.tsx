// Point d'entrée unique du site — routeur hash entre site public et dashboard admin.

'use client'

import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useHashRoute } from '@/hooks/use-hash-route'
import { SiteApp } from '@/components/site/SiteApp'
import { AdminApp } from '@/components/admin/AdminApp'

export default function Page() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )
  const { route, navigate } = useHashRoute()

  // Retour en haut de page à chaque changement de vue (pas de filtre).
  const segmentsKey = route.segments.join('/')
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [segmentsKey])

  const isAdminRoute = route.segments[0] === 'admin'

  return (
    <QueryClientProvider client={queryClient}>
      {isAdminRoute ? (
        <AdminApp route={route} navigate={navigate} />
      ) : (
        <SiteApp route={route} navigate={navigate} />
      )}
    </QueryClientProvider>
  )
}
