// /api/auth/me — vérification de session (200 toujours, sans 401 bruyant).

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  return NextResponse.json({ admin })
}
