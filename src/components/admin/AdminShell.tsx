// Coque du dashboard : sidebar fixe (desktop), menu mobile (Sheet), en-tête, zone contenu.

'use client'

import { useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Image from 'next/image'
import {
  ExternalLink,
  Images,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { api, adminApi, ApiError } from '@/lib/api-client'
import type { AdminInfo, Route } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import type { NavigateFn } from './admin-hooks'

interface NavItem {
  label: string
  icon: LucideIcon
  href: string
  /** null = tableau de bord (racine). */
  segment: string | null
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', icon: LayoutDashboard, href: '#/admin', segment: null },
  { label: 'Produits', icon: Package, href: '#/admin/produits', segment: 'produits' },
  { label: 'Commandes', icon: ShoppingBag, href: '#/admin/commandes', segment: 'commandes' },
  { label: 'Messages', icon: Mail, href: '#/admin/messages', segment: 'messages' },
  { label: 'Clients', icon: Users, href: '#/admin/clients', segment: 'clients' },
  { label: 'Images', icon: Images, href: '#/admin/images', segment: 'images' },
  { label: 'Paramètres', icon: Settings, href: '#/admin/parametres', segment: 'parametres' },
]

function isActive(item: NavItem, seg: string[]): boolean {
  if (item.segment === null) return seg.length === 0
  return seg[0] === item.segment
}

export function AdminShell({
  route,
  navigate,
  admin,
  children,
}: {
  route: Route
  navigate: NavigateFn
  admin: AdminInfo
  children: ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const queryClient = useQueryClient()

  // Badge de messages non lus (partage le cache avec le tableau de bord).
  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
    staleTime: 60_000,
  })
  const unread = statsQuery.data?.unreadMessages ?? 0

  const logoutMutation = useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me'] })
      navigate('#/admin/connexion', { replace: true })
      toast.success('Vous êtes déconnecté')
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        void queryClient.invalidateQueries({ queryKey: ['me'] })
        navigate('#/admin/connexion', { replace: true })
        return
      }
      toast.error(
        error instanceof Error
          ? error.message
          : 'Déconnexion impossible. Veuillez réessayer.'
      )
    },
  })

  const seg = route.segments[0] === 'admin' ? route.segments.slice(1) : []
  const currentItem = NAV_ITEMS.find((item) => isActive(item, seg))
  const pageTitle = currentItem?.label ?? 'Tableau de bord'

  const goTo = (href: string) => {
    setMobileOpen(false)
    navigate(href)
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-forest-deep text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <Image
          src="/images/logo-embleme-fonce.png"
          alt="Emblème E.T.P.S Belle Odeur"
          width={44}
          height={44}
          className="size-11 shrink-0 rounded-full border border-gold/40 object-cover"
          priority
        />
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold leading-tight">
            E.T.P.S BELLE ODEUR
          </p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
            Administration
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 py-4" aria-label="Navigation administration">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item, seg)
          const Icon = item.icon
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => goTo(item.href)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border-l-2 px-4 py-2.5 text-sm transition-colors',
                active
                  ? 'border-gold bg-white/10 text-white'
                  : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
              {item.segment === 'messages' && unread > 0 ? (
                <span className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-gold text-[10px] font-semibold text-forest">
                  {unread > 99 ? '99+' : unread}
                </span>
              ) : null}
            </button>
          )
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 py-4">
        <a
          href="#/"
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          Voir le site
        </a>
        <button
          type="button"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-60"
        >
          {logoutMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="size-4" aria-hidden="true" />
          )}
          Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream/60">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:flex lg:flex-col">
        {sidebarContent}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-64 gap-0 border-r-0 bg-forest-deep p-0 text-white [&>button]:text-white/80"
        >
          <SheetTitle className="sr-only">Menu d&apos;administration</SheetTitle>
          <SheetDescription className="sr-only">
            Navigation principale du tableau de bord
          </SheetDescription>
          {sidebarContent}
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="size-5" aria-hidden="true" />
            </Button>
            <p className="truncate font-display text-lg font-semibold text-forest lg:text-xl">
              {pageTitle}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <span
              className="flex size-8 items-center justify-center rounded-full bg-gold/20 text-sm font-semibold text-gold-deep"
              aria-hidden="true"
            >
              {admin.username.charAt(0).toUpperCase()}
            </span>
            <span className="text-sm text-forest">{admin.username}</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
