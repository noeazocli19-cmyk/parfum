// /api/admin/messages — messages du formulaire de contact.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { jsonError } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  try {
    const messages = await db.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ messages })
  } catch {
    return jsonError(500, 'Impossible de charger les messages.')
  }
}
