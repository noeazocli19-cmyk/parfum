// /api/telecharger-site — désactivé pour des raisons de sécurité.

import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  return NextResponse.json(
    { error: 'Cette fonctionnalité a été désactivée.' },
    { status: 410 }
  )
}
