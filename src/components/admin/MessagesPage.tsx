// Messages reçus via le formulaire de contact : lecture, suivi, suppression.

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Mail, MailOpen, Phone, Trash2 } from 'lucide-react'
import { adminApi } from '@/lib/api-client'
import { formatDate, telHref } from '@/lib/format'
import type { ContactMessageDTO } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { Spinner } from '@/components/shared/spinner'
import { cn } from '@/lib/utils'
import {
  handleMutationError,
  useAdminQuery,
  type NavigateFn,
} from './admin-hooks'
import { AdminPageHeader, ConfirmDialog } from './admin-ui'

function MessageCard({
  message,
  onToggleRead,
  onDelete,
  pending,
}: {
  message: ContactMessageDTO
  onToggleRead: () => void
  onDelete: () => void
  pending: boolean
}) {
  return (
    <article
      className={cn(
        'rounded-xl border bg-white p-4',
        !message.isRead && 'border-l-2 border-l-gold'
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {!message.isRead ? (
            <span className="size-2 shrink-0 rounded-full bg-gold" aria-hidden="true" />
          ) : null}
          <p className="font-medium text-forest">{message.name}</p>
          <a
            href={telHref(message.phone)}
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-forest hover:underline"
          >
            <Phone className="size-3.5" aria-hidden="true" />
            {message.phone}
          </a>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatDate(message.createdAt)}
        </span>
      </div>

      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
        {message.message}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleRead}
          disabled={pending}
        >
          {message.isRead ? (
            <Mail className="size-4" aria-hidden="true" />
          ) : (
            <MailOpen className="size-4" aria-hidden="true" />
          )}
          {message.isRead ? 'Marquer comme non lu' : 'Marquer comme lu'}
        </Button>
        <ConfirmDialog
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              aria-label={`Supprimer le message de ${message.name}`}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Supprimer
            </Button>
          }
          title="Supprimer ce message ?"
          description="Cette action est définitive. Le message sera définitivement supprimé."
          confirmLabel="Supprimer"
          onConfirm={onDelete}
        />
      </div>
    </article>
  )
}

export function MessagesPage({ navigate }: { navigate: NavigateFn }) {
  const queryClient = useQueryClient()

  const messagesQuery = useAdminQuery({
    queryKey: ['admin-messages'],
    queryFn: () => adminApi.getMessages(),
    navigate,
  })
  const messages = messagesQuery.data?.messages ?? []
  const unreadCount = messages.filter((message) => !message.isRead).length

  const markMutation = useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) =>
      adminApi.markMessage(id, isRead),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-messages'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: (error) => handleMutationError(error, navigate),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteMessage(id),
    onSuccess: () => {
      toast.success('Message supprimé')
      void queryClient.invalidateQueries({ queryKey: ['admin-messages'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: (error) => handleMutationError(error, navigate),
  })

  return (
    <div>
      <AdminPageHeader
        eyebrow="Service client"
        title="Messages"
        description={
          messagesQuery.isPending
            ? 'Chargement des messages…'
            : `${messages.length} message${messages.length > 1 ? 's' : ''} · ${unreadCount} non lu${unreadCount > 1 ? 's' : ''}`
        }
      />

      {messagesQuery.isPending ? (
        <Spinner label="Chargement des messages…" />
      ) : messagesQuery.error ? (
        <p className="text-sm text-destructive" role="alert">
          {messagesQuery.error.message}
        </p>
      ) : messages.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="Aucun message"
          description="Les messages du formulaire de contact apparaîtront ici."
        />
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              pending={markMutation.isPending}
              onToggleRead={() =>
                markMutation.mutate({ id: message.id, isRead: !message.isRead })
              }
              onDelete={() => deleteMutation.mutate(message.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
