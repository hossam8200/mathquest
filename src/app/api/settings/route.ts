// GET /api/settings — public app settings (announcement, feature flags)
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const settings = await db.appSetting.findMany()
  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value
  return NextResponse.json({
    announcement: map.announcement || '',
    maintenanceMode: map.maintenance_mode === 'true',
    features: {
      marketplace: map.marketplace_enabled !== 'false',
      matchGame: map.match_game_enabled !== 'false',
      leaderboard: map.leaderboard_enabled !== 'false',
      dailyChallenge: map.daily_challenge_enabled !== 'false',
    },
  })
}
