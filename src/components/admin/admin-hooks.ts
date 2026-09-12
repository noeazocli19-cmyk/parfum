// Hooks et utilitaires partagés du dashboard administrateur.

'use client'

import { useEffect } from 'react'
import { useQuery, type QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api-client'

export type NavigateFn = (to: string, options?: { replace?: boolean }) => void

/** Taille maximale d'une image téléversée (5 Mo, alignée sur l'API). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

/** Formats d'images acceptés par l'API d'upload. */
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function isSupportedImage(file: File): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(file.type)
}

/** Gère l'erreur d'une mutation : session expirée (401) ou message applicatif. */
export function handleMutationError(error: unknown, navigate: NavigateFn): void {
  if (error instanceof ApiError && error.status === 401) {
    toast.error('Session expirée, veuillez vous reconnecter.')
    navigate('#/admin/connexion', { replace: true })
    return
  }
  toast.error(
    error instanceof Error
      ? error.message
      : 'Une erreur est survenue. Veuillez réessayer.'
  )
}

interface AdminQueryOptions<TData> {
  queryKey: QueryKey
  queryFn: () => Promise<TData>
  navigate: NavigateFn
  enabled?: boolean
  staleTime?: number
  refetchInterval?: number | false
}

/** useQuery avec déconnexion automatique vers la page de connexion en cas d'erreur 401. */
export function useAdminQuery<TData>({
  navigate,
  queryKey,
  queryFn,
  enabled,
  staleTime,
  refetchInterval,
}: AdminQueryOptions<TData>) {
  const query = useQuery<TData, Error>({
    queryKey,
    queryFn,
    enabled,
    staleTime,
    refetchInterval,
  })

  useEffect(() => {
    if (query.error instanceof ApiError && query.error.status === 401) {
      toast.error('Session expirée, veuillez vous reconnecter.')
      navigate('#/admin/connexion', { replace: true })
    }
  }, [query.error, navigate])

  return query
}
