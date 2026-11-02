// GET /api/progress/badges — all badges with earned state for current user.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { BadgeInfo } from '@/types'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const badges = await db.badge.findMany({ orderBy: { coinReward: 'asc' } })
  const earned = await db.userBadge.findMany({
    where: { userId: user.id },
    select: { badgeId: true, earnedAt: true },
  })
  const earnedMap = new Map(earned.map((e) => [e.badgeId, e.earnedAt]))

  const result: BadgeInfo[] = badges.map((b) => ({
    id: b.id,
    key: b.key,
    name: b.name,
    description: b.description,
    emoji: b.emoji,
    coinReward: b.coinReward,
    earned: earnedMap.has(b.id),
    earnedAt: earnedMap.get(b.id)?.toISOString() ?? null,
  }))
  return NextResponse.json({ badges: result })
}
