// Hook réglages du site — requête partagée + valeurs par défaut le temps du chargement.

'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { DEFAULT_SETTINGS } from '@/lib/site-defaults'
import type { SiteSettings } from '@/lib/types'

export function useSettings(): {
  settings: SiteSettings
  isLoading: boolean
} {
  const query = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
  })

  return {
    settings: query.data ?? DEFAULT_SETTINGS,
    isLoading: query.isLoading,
  }
}
