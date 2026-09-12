// Routeur minimaliste basé sur le hash (#/boutique?categorie=HOMME).
// useSyncExternalStore : SSR-safe (snapshot serveur '#/'), hydratation correcte,
// mise à jour par l'événement hashchange — sans setState dans un effet.

'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import type { Route } from '@/lib/types'

function parseHash(raw: string): Route {
  let hash = raw.replace(/^#/, '')
  if (!hash.startsWith('/')) hash = `/${hash}`
  const [path, queryString = ''] = hash.split('?')
  const segments = path
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment)
      } catch {
        return segment
      }
    })
  const query: Record<string, string> = {}
  if (queryString) {
    for (const [key, value] of new URLSearchParams(queryString)) {
      query[key] = value
    }
  }
  return { segments, query, raw }
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function getSnapshot(): string {
  return window.location.hash || '#/'
}

function getServerSnapshot(): string {
  return '#/'
}

export function useHashRoute() {
  const hash = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const route = useMemo(() => parseHash(hash), [hash])

  const navigate = useCallback(
    (to: string, options?: { replace?: boolean }) => {
      const target = to.startsWith('#')
        ? to
        : `#${to.startsWith('/') ? to : `/${to}`}`
      if (options?.replace) {
        window.location.replace(target)
      } else {
        window.location.hash = target
      }
    },
    []
  )

  return { route, navigate }
}

/** Construit un lien hash avec query params (les valeurs vides sont ignorées). */
export function buildHash(
  path: string,
  query?: Record<string, string | undefined>
): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') params.set(key, value)
  }
  const qs = params.toString()
  return `#/${path.replace(/^\//, '')}${qs ? `?${qs}` : ''}`
}
