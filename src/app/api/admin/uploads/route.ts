// /api/admin/uploads — liste et suppression des images téléversées.

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { jsonError } from '@/lib/api-utils'
import type { UploadedImage } from '@/lib/types'
import { cloudinary, hasCloudinaryConfig } from '@/lib/cloudinary'

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  if (!hasCloudinaryConfig()) {
    return NextResponse.json({ images: [] })
  }

  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'etps-belle-odeur/',
      max_results: 50,
    })

    const images: UploadedImage[] = (result.resources ?? []).map((resource: any) => ({
      name: String(resource.public_id.split('/').pop() ?? 'image'),
      url: String(resource.secure_url),
      size: Number(resource.bytes ?? 0),
      modifiedAt: String(resource.created_at ?? new Date().toISOString()),
    }))

    images.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
    return NextResponse.json({ images })
  } catch {
    return jsonError(500, 'Impossible de lister les images Cloudinary.')
  }
}

export async function DELETE(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  if (!hasCloudinaryConfig()) {
    return jsonError(500, 'Cloudinary n’est pas configuré.')
  }

  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name') ?? ''
  const extension = name.includes('.') ? name.slice(name.lastIndexOf('.')).toLowerCase() : ''

  if (!name || !ALLOWED_EXTENSIONS.has(extension)) {
    return jsonError(400, "Nom d'image invalide.")
  }

  try {
    const publicId = `etps-belle-odeur/${name}`
    await cloudinary.uploader.destroy(publicId)
    return NextResponse.json({ ok: true })
  } catch {
    return jsonError(404, 'Image introuvable.')
  }
}
