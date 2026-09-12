// Indique si le composant est monté côté client (hydratation terminée).
// Pattern React 19 : useSyncExternalStore évite tout setState dans un effet.

'use client'

import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}
