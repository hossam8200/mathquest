// GET /api/progress/leaderboard — top users by total points (global + weekly).
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { LeaderboardRow } from '@/types'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  // Global: sum points from rounds + sessions per user, top 20.
  const roundAgg = await db.roundResult.groupBy({
    by: ['userId'],
    _sum: { pointsEarned: true },
  })
  const sessionAgg = await db.studySession.groupBy({
    by: ['userId'],
    _sum: { pointsEarned: true },
  })
  const totals = new Map<string, number>()
  for (const r of roundAgg) totals.set(r.userId, (totals.get(r.userId) ?? 0) + (r._sum.pointsEarned ?? 0))
  for (const s of sessionAgg) totals.set(s.userId, (totals.get(s.userId) ?? 0) + (s._sum.pointsEarned ?? 0))

  // Fetch user nicknames + avatars (exclude guests)
  const users = await db.user.findMany({
    where: { role: { not: 'guest' } },
    select: { id: true, nickname: true, avatarCharacterId: true },
  })
  const userMap = new Map(users.map((u) => [u.id, u]))

  const globalRows: LeaderboardRow[] = [...totals.entries()]
    .filter(([uid]) => userMap.has(uid))
    .map(([uid, pts]) => ({
      nickname: userMap.get(uid)!.nickname,
      avatarCharacterId: userMap.get(uid)!.avatarCharacterId,
      totalPoints: pts,
      isCurrentUser: uid === user.id,
      rank: 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 20)
    .map((r, i) => ({ ...r, rank: i + 1 }))

  // Weekly: points earned in the last 7 days
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const weeklyRounds = await db.roundResult.findMany({
    where: { createdAt: { gte: weekAgo } },
    select: { userId: true, pointsEarned: true },
  })
  const weeklySessions = await db.studySession.findMany({
    where: { startedAt: { gte: weekAgo } },
    select: { userId: true, pointsEarned: true },
  })
  const weeklyTotals = new Map<string, number>()
  for (const r of weeklyRounds) weeklyTotals.set(r.userId, (weeklyTotals.get(r.userId) ?? 0) + r.pointsEarned)
  for (const s of weeklySessions) weeklyTotals.set(s.userId, (weeklyTotals.get(s.userId) ?? 0) + s.pointsEarned)

  const weeklyRows: LeaderboardRow[] = [...weeklyTotals.entries()]
    .filter(([uid]) => userMap.has(uid))
    .map(([uid, pts]) => ({
      nickname: userMap.get(uid)!.nickname,
      avatarCharacterId: userMap.get(uid)!.avatarCharacterId,
      totalPoints: pts,
      isCurrentUser: uid === user.id,
      rank: 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 20)
    .map((r, i) => ({ ...r, rank: i + 1 }))

  return NextResponse.json({ global: globalRows, weekly: weeklyRows })
}
