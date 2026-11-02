// GET /api/parent/dashboard — child progress overview for parents.
// Returns: time played today, total stats, weak areas, deck mastery, streaks.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  // Time played today (from rounds + sessions)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
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

  // Accuracy by operation (weak areas = lowest accuracy)
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
    accuracyByOp[t.operation] = t._count.id > 0
      ? Math.round(((c?._count.id ?? 0) / t._count.id) * 100)
      : 0
  }
  const weakAreas = Object.entries(accuracyByOp)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([op, pct]) => ({ operation: op, accuracy: pct }))

  // Deck mastery
  const decks = await db.deck.findMany({
    where: {
      OR: [
        { isBuiltIn: true, ageBand: user.ageBand ?? '8-10' },
        { ownerId: user.id },
        { assignedTo: { some: { id: user.id } } },
      ],
    },
    include: { _count: { select: { cards: true } } },
    select: { id: true, title: true, _count: true },
  })
  const deckMastery: { id: string; title: string; masteryPct: number; cardCount: number }[] = []
  for (const d of decks) {
    const mastered = await db.cardProgress.count({
      where: {
        userId: user.id, status: 'mastered',
        card: { deckId: d.id },
      },
    })
    deckMastery.push({
      id: d.id, title: d.title,
      masteryPct: d._count.cards > 0 ? Math.round((mastered / d._count.cards) * 100) : 0,
      cardCount: d._count.cards,
    })
  }

  // Weak cards (status learning/reviewing)
  const weakCards = await db.cardProgress.findMany({
    where: { userId: user.id, status: { in: ['learning', 'reviewing'] } },
    include: { card: { select: { front: true, back: true, deck: { select: { title: true } } } } },
    take: 10,
    orderBy: { lastReviewed: 'desc' },
  })

  // Streaks
  const studyStreak = await db.streak.findUnique({
    where: { userId_type: { userId: user.id, type: 'study' } },
  })
  const loginStreak = await db.streak.findUnique({
    where: { userId_type: { userId: user.id, type: 'login' } },
  })

  // All built-in decks (for assign)
  const allBuiltin = await db.deck.findMany({
    where: { isBuiltIn: true },
    select: { id: true, title: true, coverIcon: true, ageBand: true, operation: true },
    orderBy: { title: 'asc' },
  })
  const assignedDecks = await db.deck.findMany({
    where: { assignedTo: { some: { id: user.id } } },
    select: { id: true },
  })
  const assignedIds = new Set(assignedDecks.map((d) => d.id))

  // Levels completed
  const levelsCompleted = await db.roundResult.findMany({
    where: { userId: user.id, score: { gte: 70 } },
    select: { levelId: true },
    distinct: ['levelId'],
  })

  return NextResponse.json({
    timePlayedTodaySec,
    levelsCompleted: levelsCompleted.length,
    accuracyByOp,
    weakAreas,
    deckMastery,
    weakCards: weakCards.map((c) => ({
      front: c.card.front, back: c.card.back, deckTitle: c.card.deck.title,
      status: c.status,
    })),
    studyStreak: studyStreak?.current ?? 0,
    loginStreak: loginStreak?.current ?? 0,
    longestStudyStreak: studyStreak?.longest ?? 0,
    allBuiltin: allBuiltin.map((d) => ({ ...d, assigned: assignedIds.has(d.id) })),
    dailyTimeLimitMins: user.dailyTimeLimitMins,
    dailyCardGoal: user.dailyCardGoal,
  })
}
