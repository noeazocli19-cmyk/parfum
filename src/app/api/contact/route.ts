// /api/contact — POST : message du formulaire de contact (public).

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { clientIp, rateLimit } from '@/lib/auth'
import { jsonError, readJson } from '@/lib/api-utils'
import { contactInputSchema, formatZodError } from '@/lib/validations'

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  const limit = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)
  if (!limit.ok) {
    return jsonError(
      429,
      `Trop de messages envoyés. Réessayez dans ${Math.ceil(limit.retryAfterSec / 60)} minutes.`
    )
  }

  const body = await readJson<unknown>(req)
  const parsed = contactInputSchema.safeParse(body)
  if (!parsed.success) return jsonError(400, formatZodError(parsed.error))

  try {
    await db.contactMessage.create({
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        message: parsed.data.message,
      },
    })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return jsonError(500, "Impossible d'envoyer votre message. Veuillez réessayer.")
  }
}
