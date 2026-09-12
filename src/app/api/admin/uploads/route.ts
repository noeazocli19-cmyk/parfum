// /api/admin/uploads — liste et suppression des images téléversées.

import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat, unlink } from 'fs/promises'
import path from 'path'
import { requireAdmin } from '@/lib/auth'
import { jsonError } from '@/lib/api-utils'
import type { UploadedImage } from '@/lib/types'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  try {
    let files: string[] = []
    try {
      files = await readdir(UPLOAD_DIR)
    } catch {
      files = []
    }

    const images: UploadedImage[] = []
    for (const name of files) {
      const extension = path.extname(name).toLowerCase()
      if (!ALLOWED_EXTENSIONS.has(extension)) continue
      const info = await stat(path.join(UPLOAD_DIR, name))
      images.push({
        name,
        url: `/uploads/${name}`,
        size: info.size,
        modifiedAt: info.mtime.toISOString(),
      })
    }
    images.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))

    return NextResponse.json({ images })
  } catch {
    return jsonError(500, 'Impossible de lister les images.')
  }
}

export async function DELETE(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(req.url)
  const name = path.basename(searchParams.get('name') ?? '')
  const extension = path.extname(name).toLowerCase()

  if (!name || !ALLOWED_EXTENSIONS.has(extension)) {
    return jsonError(400, "Nom d'image invalide.")
  }

  try {
    await unlink(path.join(UPLOAD_DIR, name))
    return NextResponse.json({ ok: true })
  } catch {
    return jsonError(404, 'Image introuvable.')
  }
}
