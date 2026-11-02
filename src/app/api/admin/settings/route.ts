// GET  /api/admin/settings — get all app settings (feature flags, announcements)
// POST /api/admin/settings — set an app setting
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

export async function GET() {
  try { await requireRole('admin') } catch { return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) }
  const settings = await db.appSetting.findMany()
  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value
  // Defaults
  return NextResponse.json({
    settings: {
      announcement: map.announcement || '',
      marketplace_enabled: map.marketplace_enabled ?? 'true',
      match_game_enabled: map.match_game_enabled ?? 'true',
      leaderboard_enabled: map.leaderboard_enabled ?? 'true',
      daily_challenge_enabled: map.daily_challenge_enabled ?? 'true',
      maintenance_mode: map.maintenance_mode ?? 'false',
    },
  })
}

const Schema = z.object({
  key: z.string().min(1),
  value: z.string(),
})

export async function POST(req: Request) {
  try { await requireRole('admin') } catch { return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) }
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const setting = await db.appSetting.upsert({
    where: { key: parsed.data.key },
    update: { value: parsed.data.value },
    create: { key: parsed.data.key, value: parsed.data.value },
  })
  return NextResponse.json({ setting })
}
