// Sécurité — sessions admin (JWT httpOnly), hachage bcrypt, limitation de débit.
// Exécuté exclusivement côté serveur.

import { SignJWT, jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import type { AdminInfo } from '@/lib/types'

export const SESSION_COOKIE = 'bo_session'

const encoder = new TextEncoder()

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    // En production, SESSION_SECRET doit être défini dans .env (32+ caractères).
    throw new Error('SESSION_SECRET manquant ou trop court')
  }
  return encoder.encode(secret)
}

function sessionHours(): number {
  const h = Number(process.env.ADMIN_SESSION_HOURS)
  return Number.isFinite(h) && h > 0 ? h : 8
}

export interface SessionPayload extends AdminInfo {
  exp: number
}

export async function createSessionToken(admin: AdminInfo): Promise<string> {
  return new SignJWT({ username: admin.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime(`${sessionHours()}h`)
    .sign(getSecret())
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (!payload.sub || typeof payload.username !== 'string') return null
    return {
      id: payload.sub,
      username: payload.username,
      exp: payload.exp ?? 0,
    }
  } catch {
    return null
  }
}

/** Récupère la session admin d'une requête (cookie httpOnly). */
export async function getAdminFromRequest(
  req: NextRequest
): Promise<AdminInfo | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  const payload = await verifySessionToken(token)
  if (!payload) return null
  return { id: payload.id, username: payload.username }
}

/**
 * Garde d'accès pour les routes d'administration.
 * Vérifie la session + une protection CSRF légère (Origine identique).
 * Renvoie null si autorisé, sinon une NextResponse 401/403 prête à retourner.
 */
export async function requireAdmin(
  req: NextRequest
): Promise<NextResponse | null> {
  const admin = await getAdminFromRequest(req)
  if (!admin) {
    return NextResponse.json(
      { error: 'Non autorisé. Connectez-vous à nouveau.' },
      { status: 401 }
    )
  }
  // Protection CSRF : si l'en-tête Origin est présent, il doit correspondre au host.
  const origin = req.headers.get('origin')
  if (origin) {
    const host =
      req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? ''
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.json(
          { error: 'Requête refusée (origine invalide).' },
          { status: 403 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Requête refusée (origine invalide).' },
        { status: 403 }
      )
    }
  }
  return null
}

/** Options du cookie de session. */
export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  }
}

// ─── Limitation de débit (mémoire locale) ────────────────────────────────────

const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterSec: 0 }
  }

  bucket.count += 1
  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    }
  }
  return { ok: true, retryAfterSec: 0 }
}

/** Nettoyage périodique des compteurs (évite la croissance mémoire). */
if (typeof setInterval === 'function') {
  const cleaner = setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key)
    }
  }, 10 * 60 * 1000)
  if (typeof cleaner === 'object' && 'unref' in cleaner) cleaner.unref()
}

/** IP client (derrière le proxy Caddy). */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'local'
}
