// Briques d'interface réutilisées dans les vues du dashboard administrateur.

'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

/** En-tête de page admin : lien retour éventuel, eyebrow, titre serif, actions. */
export function AdminPageHeader({
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
  actions,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        {backHref && backLabel ? (
          <a
            href={backHref}
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-forest"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {backLabel}
          </a>
        ) : null}
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="font-display text-2xl font-semibold leading-tight text-forest sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}

/** Carte blanche standard du dashboard. */
export function AdminCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('rounded-xl border bg-white', className)}>{children}</div>
}

/** Message d'erreur inline sous un champ de formulaire. */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  )
}

/** Boîte de dialogue de confirmation pour les actions définitives. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Supprimer',
  onConfirm,
}: {
  trigger: ReactNode
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={() => onConfirm()}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Carte statistique du tableau de bord. */
export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  href,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  sub?: ReactNode
  accent?: boolean
  href?: string
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Icon
          className={cn('size-4 shrink-0', accent ? 'text-gold-deep' : 'text-forest/50')}
          aria-hidden="true"
        />
      </div>
      <p className="mt-2 font-display text-2xl font-semibold leading-none text-forest xl:text-3xl">
        {value}
      </p>
      {sub ? (
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{sub}</p>
      ) : null}
    </>
  )
  if (href) {
    return (
      <a
        href={href}
        className="block rounded-xl border bg-white p-5 transition-colors hover:border-gold/50"
      >
        {body}
      </a>
    )
  }
  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-5',
        accent && 'border-gold/40'
      )}
    >
      {body}
    </div>
  )
}

/** Petit badge doré « À confirmer » (commande avec prix sur demande). */
export function UndeterminedBadge() {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold-deep">
      À confirmer
    </span>
  )
}

/** Bouton d'envoi avec indicateur de chargement. */
export function SubmitLabel({
  pending,
  idle,
  pendingLabel = 'Enregistrement…',
}: {
  pending: boolean
  idle: string
  pendingLabel?: string
}) {
  return (
    <>
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : null}
      {pending ? pendingLabel : idle}
    </>
  )
}
