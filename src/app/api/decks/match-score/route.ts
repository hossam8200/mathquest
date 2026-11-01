// POST /api/decks/match-score — save a Match game result.
// Body: { deckId, timeSec, mistakes, pairs, score }
// Awards points + coins, bumps streak + daily challenge.
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { matchScore } from '@/lib/scoring'
import { bumpStreak } from '@/lib/streaks'
import { bumpDailyProgress } from '@/lib/daily'

const Schema = z.object({
  deckId: z.string(),
  timeSec: z.number().int().min(0),
  mistakes: z.number().int().min(0),
  pairs: z.number().int().min(1),
})

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  const { deckId, timeSec, mistakes, pairs } = parsed.data

  // Server-side score computation (don't trust client)
  const result = matchScore(timeSec, mistakes, pairs)

  // Save score
  const ms = await db.matchScore.create({
    data: { userId: user.id, deckId, timeSec, mistakes, score: result.score, pairs },
  })

  // Study session record
  const session = await db.studySession.create({
    data: {
      userId: user.id, deckId, mode: 'match',
      cardsReviewed: pairs, newLearned: 0, accuracy: mistakes === 0 ? 1 : pairs / (pairs + mistakes),
      durationSec: timeSec, pointsEarned: result.points, coinsEarned: result.coins,
      endedAt: new Date(),
    },
  })

  // Award coins + transaction
  if (result.coins > 0) {
    await db.user.update({ where: { id: user.id }, data: { coins: { increment: result.coins } } })
    await db.transaction.create({ data: { userId: user.id, type: 'earn', amount: result.coins, reason: 'round', refId: session.id } })
  }

  // Streak + daily
  try {
    await bumpStreak(user.id, 'study')
    await bumpDailyProgress(user.id, 'match', 1)
    await bumpDailyProgress(user.id, 'points', result.points)
  } catch (e) { console.error('streak/daily bump failed', e) }

  return NextResponse.json({
    score: result.score, points: result.points, coins: result.coins,
    isBestTime: false, // client can compare with previous best
  })
}
