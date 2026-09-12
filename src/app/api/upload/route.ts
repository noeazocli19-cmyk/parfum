import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { requireAdmin } from '@/lib/auth'
import { hasCloudinaryConfig, cloudinary } from '@/lib/cloudinary'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const formData = await req.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Fichier manquant.' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Le fichier doit être une image.' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image trop volumineuse (5 Mo maximum).' }, { status: 400 })
  }

  if (!hasCloudinaryConfig()) {
    return NextResponse.json(
      { error: 'Cloudinary n’est pas configuré côté serveur.' },
      { status: 500 }
    )
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileName = `site-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, '-')}`

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'etps-belle-odeur', public_id: fileName.replace(/\.[^/.]+$/, ''), resource_type: 'image' },
        (error, uploaded) => {
          if (error || !uploaded) {
            reject(error || new Error('Upload Cloudinary impossible.'))
            return
          }
          resolve({ secure_url: uploaded.secure_url })
        }
      )

      uploadStream.end(buffer)
    })

    return NextResponse.json({ url: result.secure_url })
  } catch (error) {
    console.error('Cloudinary upload error:', error)

    const fallbackPath = path.join(process.cwd(), 'public', 'uploads', `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, '-')}`)
    try {
      await writeFile(fallbackPath, Buffer.from(await file.arrayBuffer()))
      return NextResponse.json({ url: `/uploads/${path.basename(fallbackPath)}` })
    } catch {
      return NextResponse.json({ error: 'Impossible de téléverser l’image.' }, { status: 500 })
    }
  }
}
