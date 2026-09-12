// /api/admin/settings — lecture / mise à jour des réglages du site.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { jsonError, readJson } from '@/lib/api-utils'
import { settingsInputSchema, formatZodError } from '@/lib/validations'
import { DEFAULT_SETTINGS } from '@/lib/site-defaults'
import { SETTING_KEYS, type SiteSettings } from '@/lib/types'

async function loadSettings(): Promise<SiteSettings> {
  const rows = await db.setting.findMany({
    where: { key: { in: [...SETTING_KEYS] } },
  })
  const values = new Map(rows.map((row) => [row.key, row.value]))
  return Object.fromEntries(
    SETTING_KEYS.map((key) => [key, values.get(key) ?? DEFAULT_SETTINGS[key]])
  ) as unknown as SiteSettings
}

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  try {
    return NextResponse.json({ settings: await loadSettings() })
  } catch {
    return jsonError(500, 'Impossible de charger les réglages.')
  }
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const body = await readJson<unknown>(req)
  const parsed = settingsInputSchema.safeParse(body)
  if (!parsed.success) return jsonError(400, formatZodError(parsed.error))

  try {
    // Seules les clés connues sont acceptées.
    for (const [key, value] of Object.entries(parsed.data)) {
      if (!SETTING_KEYS.includes(key as keyof SiteSettings)) continue
      await db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    }
    return NextResponse.json({ settings: await loadSettings() })
  } catch {
    return jsonError(500, 'Impossible de mettre à jour les réglages.')
  }
}
