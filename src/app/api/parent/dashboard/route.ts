// GET /api/parent/dashboard — comprehensive child progress overview for parents.
// Fixed: no include+select conflicts, optimized queries, richer data for the redesigned UI.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  // ─── Time played (today + this week) ───
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const todayRounds = await db.roundResult.findMany({
    where: { userId: user.id, createdAt: { gte: todayStart } },
    select: { durationMs: true, score: true },
  })
  const todaySessions = await db.studySession.findMany({
    where: { userId: user.id, startedAt: { gte: todayStart } },
    select: { durationSec: true },
  })
  const timePlayedTodaySec = Math.round(
    todayRounds.reduce((s, r) => s + r.durationMs, 0) / 1000 +
    todaySessions.reduce((s, r) => s + r.durationSec, 0)
  )

  // ─── Weekly study chart (time studied per day, last 7 days) ───
  const weekRounds = await db.roundResult.findMany({
    where: { userId: user.id, createdAt: { gte: weekAgo } },
    select: { durationMs: true, createdAt: true },
  })
  const weekSessions = await db.studySession.findMany({
    where: { userId: user.id, startedAt: { gte: weekAgo } },
    select: { durationSec: true, startedAt: true },
  })
  const weeklyStudy: { date: string; minutes: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    const rMins = weekRounds.filter(r => r.createdAt >= d && r.createdAt < next).reduce((s, r) => s + r.durationMs, 0) / 60000
    const sMins = weekSessions.filter(s => s.startedAt >= d && s.startedAt < next).reduce((s, r) => s + r.durationSec, 0) / 60
    weeklyStudy.push({ date: d.toISOString().slice(5, 10), minutes: Math.round(rMins + sMins) })
  }

  // ─── Accuracy trend (last 7 days) ───
  const weekQuestionResults = await db.questionResult.findMany({
    where: { userId: user.id, round: { createdAt: { gte: weekAgo } } },
    select: { isCorrect: true, round: { select: { createdAt: true } } },
  })
  const accuracyTrend: { date: string; accuracy: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    const dayQs = weekQuestionResults.filter(q => q.round.createdAt >= d && q.round.createdAt < next)
    const correct = dayQs.filter(q => q.isCorrect).length
    accuracyTrend.push({
      date: d.toISOString().slice(5, 10),
      accuracy: dayQs.length > 0 ? Math.round((correct / dayQs.length) * 100) : 0,
    })
  }

  // ─── Accuracy by operation (weak areas) ───
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
    const c = correctByOp.find(x => x.operation === t.operation)
    accuracyByOp[t.operation] = t._count.id > 0 ? Math.round(((c?._count.id ?? 0) / t._count.id) * 100) : 0
  }
  const weakAreas = Object.entries(accuracyByOp)
    .filter(([op]) => op !== 'mixed')
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([op, accuracy]) => ({ operation: op, accuracy }))

  // ─── Smart recommendations: suggest decks based on weak operations ───
  const allBuiltin = await db.deck.findMany({
    where: { isBuiltIn: true },
    select: { id: true, title: true, coverIcon: true, ageBand: true, operation: true },
    orderBy: { title: 'asc' },
  })
  const assignedDecks = await db.deck.findMany({
    where: { assignedTo: { some: { id: user.id } } },
    select: { id: true },
  })
  const assignedIds = new Set(assignedDecks.map(d => d.id))

  // Recommend decks matching weak operations + user's age band
  const recommendations = weakAreas
    .map(w => allBuiltin.find(d => d.operation === w.operation && d.ageBand === user.ageBand && !assignedIds.has(d.id)))
    .filter(Boolean)
    .slice(0, 3)

  // ─── Deck mastery ───
  const userDecks = await db.deck.findMany({
    where: {
      OR: [
        { isBuiltIn: true, ageBand: user.ageBand ?? '8-10' },
        { ownerId: user.id },
        { assignedTo: { some: { id: user.id } } },
      ],
    },
    select: { id: true, title: true, coverIcon: true, _count: { select: { cards: true } } },
  })
  const deckMastery: { id: string; title: string; coverIcon: string; masteryPct: number; cardCount: number; assigned: boolean }[] = []
  for (const d of userDecks) {
    const mastered = await db.cardProgress.count({
      where: { userId: user.id, status: 'mastered', card: { deckId: d.id } },
    })
    deckMastery.push({
      id: d.id, title: d.title, coverIcon: d.coverIcon,
      masteryPct: d._count.cards > 0 ? Math.round((mastered / d._count.cards) * 100) : 0,
      cardCount: d._count.cards, assigned: assignedIds.has(d.id),
    })
  }

  // ─── Weak cards ───
  const weakCards = await db.cardProgress.findMany({
    where: { userId: user.id, status: { in: ['learning', 'reviewing'] } },
    select: {
      status: true,
      card: { select: { front: true, back: true, deck: { select: { title: true } } } },
    },
    take: 10,
    orderBy: { lastReviewed: 'desc' },
  })

  // ─── Streaks ───
  const studyStreak = await db.streak.findUnique({
    where: { userId_type: { userId: user.id, type: 'study' } },
  })
  const loginStreak = await db.streak.findUnique({
    where: { userId_type: { userId: user.id, type: 'login' } },
  })

  // ─── Levels completed + total stars ───
  const passedLevels = await db.roundResult.findMany({
    where: { userId: user.id, score: { gte: 70 } },
    select: { levelId: true, stars: true },
    distinct: ['levelId'],
  })
  const totalStars = passedLevels.reduce((s, r) => s + r.stars, 0)

  // ─── Badges earned this week ───
  const weekBadges = await db.userBadge.findMany({
    where: { userId: user.id, earnedAt: { gte: weekAgo } },
    select: { badge: { select: { emoji: true, name: true } }, earnedAt: true },
  })

  // ─── Study calendar (last 14 days) ───
  const studyDays: { date: string; studied: boolean }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    const studied = weekRounds.some(r => r.createdAt >= d && r.createdAt < next) ||
                    weekSessions.some(s => s.startedAt >= d && s.startedAt < next)
    studyDays.push({ date: d.toISOString().slice(5, 10), studied })
  }

  return NextResponse.json({
    childName: user.nickname,
    ageBand: user.ageBand,
    avatarCharacterId: user.avatarCharacterId,
    timePlayedTodaySec,
    levelsCompleted: passedLevels.length,
    totalStars,
    accuracyByOp,
    weakAreas,
    accuracyTrend,
    weeklyStudy,
    deckMastery,
    weakCards: weakCards.map(c => ({
      front: c.card.front, back: c.card.back, deckTitle: c.card.deck.title, status: c.status,
    })),
    studyStreak: studyStreak?.current ?? 0,
    longestStudyStreak: studyStreak?.longest ?? 0,
    loginStreak: loginStreak?.current ?? 0,
    weekBadges,
    studyDays,
    recommendations: recommendations.map(r => ({ ...r!, assigned: false })),
    allBuiltin: allBuiltin.map(d => ({ ...d, assigned: assignedIds.has(d.id) })),
    dailyTimeLimitMins: user.dailyTimeLimitMins,
    dailyCardGoal: user.dailyCardGoal,
  })
}
