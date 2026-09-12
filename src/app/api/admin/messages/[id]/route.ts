// /api/admin/messages/[id] — marquer lu / non lu, supprimer.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { jsonError, readJson } from '@/lib/api-utils'

type Params = { params: Promise<{ id: string }> }

const patchSchema = z.object({ isRead: z.boolean() })

export async function PATCH(req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = await readJson<unknown>(req)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return jsonError(400, 'Données invalides.')

  try {
    const message = await db.contactMessage.update({
      where: { id },
      data: { isRead: parsed.data.isRead },
    })
    return NextResponse.json({ message })
  } catch {
    return jsonError(404, 'Message introuvable.')
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const { id } = await params
  try {
    await db.contactMessage.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return jsonError(404, 'Message introuvable ou déjà supprimé.')
  }
}
