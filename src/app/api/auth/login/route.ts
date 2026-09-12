// /api/auth/login — connexion administrateur.
// Sécurité : limitation de débit (5 tentatives / 15 min / IP), mot de passe
// hashé bcrypt, session JWT signée dans un cookie httpOnly SameSite=Strict.

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import {
  SESSION_COOKIE,
  clientIp,
  createSessionToken,
  rateLimit,
  sessionCookieOptions,
} from '@/lib/auth'
import { jsonError, readJson } from '@/lib/api-utils'
import { loginInputSchema, formatZodError } from '@/lib/validations'

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  const limit = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000)
  if (!limit.ok) {
    return jsonError(
      429,
      `Trop de tentatives de connexion. Réessayez dans ${Math.ceil(limit.retryAfterSec / 60)} minutes.`
    )
  }

  const body = await readJson<unknown>(req)
  const parsed = loginInputSchema.safeParse(body)
  if (!parsed.success) return jsonError(400, formatZodError(parsed.error))

  const { username, password } = parsed.data

  try {
    const admin = await db.adminUser.findUnique({ where: { username } })
    // Comparaison systématique pour éviter les écarts de temps.
    const hash =
      admin?.passwordHash ??
      '$2a$12$C6UzMDM.H6dfI/f/IKcEeO1WfO1D1zJ4nAqUOFEnC8u1N9VJmRZma'
    const valid = await bcrypt.compare(password, hash)

    if (!admin || !valid) {
      return jsonError(401, 'Identifiants incorrects.')
    }

    await db.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    })

    const token = await createSessionToken({
      id: admin.id,
      username: admin.username,
    })
    const hours = Number(process.env.ADMIN_SESSION_HOURS) || 8

    const response = NextResponse.json({
      admin: { id: admin.id, username: admin.username },
    })
    response.cookies.set(
      SESSION_COOKIE,
      token,
      sessionCookieOptions(hours * 3600)
    )
    return response
  } catch {
    return jsonError(500, 'Erreur de connexion. Veuillez réessayer.')
  }
}
