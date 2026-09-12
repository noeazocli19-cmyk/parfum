// Médiathèque : liste des images téléversées, ajout, suppression.

'use client'

import { useRef, type ChangeEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Image from 'next/image'
import { Images, Loader2, Trash2, Upload } from 'lucide-react'
import { adminApi } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { Spinner } from '@/components/shared/spinner'
import {
  handleMutationError,
  isSupportedImage,
  MAX_UPLOAD_BYTES,
  useAdminQuery,
  type NavigateFn,
} from './admin-hooks'
import { AdminPageHeader, ConfirmDialog } from './admin-ui'

function formatKiloBytes(size: number): string {
  return `${Math.max(1, Math.round(size / 1024))} Ko`
}

export function UploadsPage({ navigate }: { navigate: NavigateFn }) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadsQuery = useAdminQuery({
    queryKey: ['admin-uploads'],
    queryFn: () => adminApi.listUploads(),
    navigate,
  })
  const images = uploadsQuery.data?.images ?? []

  const uploadMutation = useMutation({
    mutationFn: (file: File) => adminApi.uploadImage(file),
    onSuccess: () => {
      toast.success('Image ajoutée')
      void queryClient.invalidateQueries({ queryKey: ['admin-uploads'] })
    },
    onError: (error) => handleMutationError(error, navigate),
  })

  const deleteMutation = useMutation({
    mutationFn: (name: string) => adminApi.deleteUpload(name),
    onSuccess: () => {
      toast.success('Image supprimée')
      void queryClient.invalidateQueries({ queryKey: ['admin-uploads'] })
    },
    onError: (error) => handleMutationError(error, navigate),
  })

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!isSupportedImage(file)) {
      toast.error('Format non pris en charge. Utilisez JPG, PNG ou WebP.')
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error('Image trop volumineuse (5 Mo maximum).')
      return
    }
    uploadMutation.mutate(file)
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Médiathèque"
        title="Images"
        description="Images disponibles pour vos produits. Vous pouvez aussi ajouter des images directement dans le formulaire d'un parfum."
        actions={
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="size-4" aria-hidden="true" />
            )}
            Ajouter une image
          </Button>
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      {uploadsQuery.isPending ? (
        <Spinner label="Chargement des images…" />
      ) : uploadsQuery.error ? (
        <p className="text-sm text-destructive" role="alert">
          {uploadsQuery.error.message}
        </p>
      ) : images.length === 0 ? (
        <EmptyState
          icon={Images}
          title="Aucune image"
          description="Téléversez vos premières images pour illustrer vos parfums (JPG, PNG ou WebP, 5 Mo maximum)."
          action={
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4" aria-hidden="true" />
              Ajouter une image
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
          {images.map((image) => (
            <div key={image.name} className="overflow-hidden rounded-xl border bg-white">
              <div className="relative aspect-square">
                <Image
                  src={image.url}
                  alt={image.name}
                  fill
                  sizes="(max-width: 768px) 33vw, 20vw"
                  className="object-cover"
                />
              </div>
              <div className="p-2">
                <p className="truncate text-xs font-medium" title={image.name}>
                  {image.name}
                </p>
                <div className="mt-1 flex items-center justify-between gap-1">
                  <span className="text-[10px] text-muted-foreground">
                    {formatKiloBytes(image.size)}
                  </span>
                  <ConfirmDialog
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        aria-label={`Supprimer l'image ${image.name}`}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </Button>
                    }
                    title="Supprimer cette image ?"
                    description={`« ${image.name} » sera définitivement supprimée de la médiathèque.`}
                    confirmLabel="Supprimer"
                    onConfirm={() => deleteMutation.mutate(image.name)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
