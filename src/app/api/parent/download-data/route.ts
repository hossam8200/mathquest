// GET /api/parent/download-data — download all data for this child (JSON)
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const [roundResults, studySessions, purchases, badges, transactions, cardProgress, streaks, matchScores] = await Promise.all([
    db.roundResult.findMany({
      where: { userId: user.id },
      select: { score: true, stars: true, correctCount: true, totalCount: true, pointsEarned: true, coinsEarned: true, durationMs: true, createdAt: true, level: { select: { title: true, world: { select: { name: true } } } } },
    }),
    db.studySession.findMany({
      where: { userId: user.id },
      select: { mode: true, cardsReviewed: true, accuracy: true, durationSec: true, pointsEarned: true, startedAt: true },
    }),
    db.purchase.findMany({
      where: { userId: user.id },
      select: { pricePaid: true, character: { select: { name: true } }, createdAt: true },
    }),
    db.userBadge.findMany({
      where: { userId: user.id },
      select: { earnedAt: true, badge: { select: { name: true, emoji: true } } },
    }),
    db.transaction.findMany({
      where: { userId: user.id },
      select: { type: true, amount: true, reason: true, createdAt: true },
    }),
    db.cardProgress.findMany({
      where: { userId: user.id },
      select: { status: true, ease: true, correctStreak: true, totalReviews: true, lastReviewed: true, card: { select: { front: true, back: true, deck: { select: { title: true } } } } },
    }),
    db.streak.findMany({ where: { userId: user.id }, select: { type: true, current: true, longest: true } }),
    db.matchScore.findMany({ where: { userId: user.id }, select: { timeSec: true, mistakes: true, score: true, pairs: true, createdAt: true } }),
  ])

  const data = {
    account: {
      nickname: user.nickname,
      ageBand: user.ageBand,
      role: user.role,
      createdAt: user.createdAt,
      coins: user.coins,
      loginStreak: user.loginStreak,
    },
    roundResults,
    studySessions,
    purchases,
    badges,
    transactions,
    cardProgress,
    streaks,
    matchScores,
    summary: {
      totalRounds: roundResults.length,
      totalSessions: studySessions.length,
      totalBadges: badges.length,
      totalPurchases: purchases.length,
      coins: user.coins,
    },
  }

  return NextResponse.json(data, {
    headers: {
      'Content-Disposition': `attachment; filename="mathquest-data-${user.nickname}.json"`,
    },
  })
}
