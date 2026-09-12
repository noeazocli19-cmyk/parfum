// /api/auth/logout — déconnexion sécurisée (cookie supprimé).

import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth'

export async function POST(_req: NextRequest) {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0))
  return response
}
