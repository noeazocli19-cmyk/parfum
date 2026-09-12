// /api/telecharger-site — téléchargement du dossier complet du site (.zip).
// Réservé à l'administrateur : l'archive contient .env (secrets, identifiants admin).
// L'en-tête Content-Disposition: attachment force le téléchargement dans le
// navigateur, même depuis un aperçu intégré.

import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { requireAdmin } from '@/lib/auth'

const ZIP_NAME = 'etps-belle-odeur-site.zip'

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  try {
    const zipPath = path.join(process.cwd(), 'public', ZIP_NAME)
    const info = await stat(zipPath)
    const file = await readFile(zipPath)

    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${ZIP_NAME}"`,
        'Content-Length': String(info.size),
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Archive introuvable. Régénérez-la puis réessayez.' },
      { status: 404 }
    )
  }
}
