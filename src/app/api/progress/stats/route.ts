// GET /api/progress/stats — aggregate stats for the current user.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { ProgressStats } from '@/types'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  // Round results
  const rounds = await db.roundResult.findMany({
    where: { userId: user.id },
    select: { pointsEarned: true, bestStreak: true, score: true, levelId: true, createdAt: true },
  })
  const totalPointsFromRounds = rounds.reduce((s, r) => s + r.pointsEarned, 0)

  // Study sessions (flashcards + match)
  const sessions = await db.studySession.findMany({
    where: { userId: user.id },
    select: { pointsEarned: true, startedAt: true, mode: true },
  })
  const totalPointsFromSessions = sessions.reduce((s, r) => s + r.pointsEarned, 0)

  const totalPoints = totalPointsFromRounds + totalPointsFromSessions

  // Accuracy by operation (from question results)
  const correctByOp = await db.questionResult.groupBy({
    by: ['operation'],
    where: { userId: user.id, isCorrect: true },
    _count: { id: true },
  })
  const totalByOp = await db.questionResult.groupBy({
    by: ['operation'],
    where: { userId: user.id },
    _count: { id: true },
  })
  const accuracyByOp: Record<string, number> = {}
  for (const t of totalByOp) {
    const c = correctByOp.find((x) => x.operation === t.operation)
    const correct = c?._count.id ?? 0
    const total = t._count.id
    accuracyByOp[t.operation] = total > 0 ? Math.round((correct / total) * 100) : 0
  }

  // Best streak
  const bestStreak = rounds.reduce((m, r) => Math.max(m, r.bestStreak), 0)

  // Levels completed (distinct levels with score >= 70)
  const passedLevels = new Set(rounds.filter((r) => r.score >= 70).map((r) => r.levelId))
  const levelsCompleted = passedLevels.size

  // Cards mastered
  const cardsMastered = await db.cardProgress.count({
    where: { userId: user.id, status: 'mastered' },
  })

  // Streaks
  const studyStreakRow = await db.streak.findUnique({
    where: { userId_type: { userId: user.id, type: 'study' } },
  })
  const studyStreak = studyStreakRow?.current ?? 0
  const longestStudyStreak = studyStreakRow?.longest ?? 0

  // Points over time (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentRounds = rounds.filter((r) => r.createdAt >= sevenDaysAgo)
  const recentSessions = sessions.filter((s) => s.startedAt >= sevenDaysAgo)
  const pointsOverTime: { date: string; points: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    const rp = recentRounds.filter((r) => r.createdAt >= d && r.createdAt < next).reduce((s, r) => s + r.pointsEarned, 0)
    const sp = recentSessions.filter((s) => s.startedAt >= d && s.startedAt < next).reduce((s, r) => s + r.pointsEarned, 0)
    pointsOverTime.push({ date: d.toISOString().slice(0, 10), points: rp + sp })
  }

  // Cards mastered over time (last 7 days) — approximate from cardProgress lastReviewed
  const cardProgress = await db.cardProgress.findMany({
    where: { userId: user.id, status: 'mastered', lastReviewed: { not: null } },
    select: { lastReviewed: true },
  })
  const cardsMasteredOverTime: { date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    const count = cardProgress.filter((c) => c.lastReviewed && c.lastReviewed >= d && c.lastReviewed! < next).length
    cardsMasteredOverTime.push({ date: d.toISOString().slice(0, 10), count })
  }

  const stats: ProgressStats = {
    totalPoints,
    totalCoins: user.coins,
    accuracyByOp,
    bestStreak,
    levelsCompleted,
    cardsMastered,
    studyStreak,
    longestStudyStreak,
    pointsOverTime,
    cardsMasteredOverTime,
  }
  return NextResponse.json({ stats })
}
