// /api/settings — GET : réglages publics du site (textes, coordonnées).

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DEFAULT_SETTINGS } from '@/lib/site-defaults'
import { SETTING_KEYS, type SiteSettings } from '@/lib/types'

export async function GET(_req: NextRequest) {
  try {
    const rows = await db.setting.findMany({
      where: { key: { in: [...SETTING_KEYS] } },
    })
    const values = new Map(rows.map((row) => [row.key, row.value]))
    const settings = Object.fromEntries(
      SETTING_KEYS.map((key) => [key, values.get(key) ?? DEFAULT_SETTINGS[key]])
    ) as unknown as SiteSettings
    return NextResponse.json(settings)
  } catch {
    return NextResponse.json(DEFAULT_SETTINGS)
  }
}
