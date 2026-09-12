// Page de connexion à l'espace d'administration.

'use client'

import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { NavigateFn } from './admin-hooks'

export function LoginPage({ navigate }: { navigate: NavigateFn }) {
  const queryClient = useQueryClient()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loginMutation = useMutation({
    mutationFn: () => api.login(username.trim(), password),
    onSuccess: (data) => {
      // Session immédiate côté client, puis resynchronisation silencieuse.
      queryClient.setQueryData(['me'], { admin: data.admin })
      void queryClient.invalidateQueries({ queryKey: ['me'] })
      navigate('#/admin')
      toast.success(`Bienvenue, ${data.admin.username}`)
    },
    onError: (err) => {
      setError(
        err instanceof Error
          ? err.message
          : 'Connexion impossible. Veuillez réessayer.'
      )
    },
  })

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!username.trim() || !password) {
      setError('Veuillez renseigner votre identifiant et votre mot de passe.')
      return
    }
    loginMutation.mutate()
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-4 py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(201,162,39,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_115%,rgba(11,61,46,0.14),transparent_50%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <Image
            src="/images/logo-embleme.png"
            alt="Emblème E.T.P.S Belle Odeur"
            width={56}
            height={56}
            priority
            className="mx-auto size-14 rounded-full border border-gold/40 object-cover"
          />
          <h1 className="mt-4 text-center font-display text-2xl font-semibold text-forest">
            E.T.P.S BELLE ODEUR
          </h1>
          <p className="eyebrow mt-1 text-center">Espace administration</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="admin-username">Identifiant</Label>
              <Input
                id="admin-username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Mot de passe</Label>
              <Input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Connexion…
                </>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>
        </div>

        <a
          href="#/"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-forest"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Retour au site
        </a>
      </motion.div>
    </div>
  )
}
