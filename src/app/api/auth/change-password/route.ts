// /api/auth/change-password — changement de mot de passe admin (session requise).

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'
import { jsonError, readJson } from '@/lib/api-utils'
import { changePasswordSchema, formatZodError } from '@/lib/validations'

export async function POST(req: NextRequest) {
  const adminSession = await getAdminFromRequest(req)
  if (!adminSession) return jsonError(401, 'Non autorisé.')

  const body = await readJson<unknown>(req)
  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) return jsonError(400, formatZodError(parsed.error))

  try {
    const admin = await db.adminUser.findUnique({
      where: { id: adminSession.id },
    })
    if (!admin) return jsonError(401, 'Non autorisé.')

    const currentOk = await bcrypt.compare(
      parsed.data.currentPassword,
      admin.passwordHash
    )
    if (!currentOk) {
      return jsonError(400, 'Le mot de passe actuel est incorrect.')
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12)
    await db.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return jsonError(500, 'Impossible de changer le mot de passe.')
  }
}
