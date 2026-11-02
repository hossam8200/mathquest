// POST /api/decks/study-session — record a completed Learn session.
// Body: { deckId, cardsReviewed, newLearned, correctCount, durationSec }
// Awards points + coins, bumps streak + daily.
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { bumpStreak } from '@/lib/streaks'
import { bumpDailyProgress } from '@/lib/daily'

const Schema = z.object({
  deckId: z.string(),
  cardsReviewed: z.number().int().min(0),
  newLearned: z.number().int().min(0),
  correctCount: z.number().int().min(0),
  durationSec: z.number().int().min(0),
})

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  const { deckId, cardsReviewed, newLearned, correctCount, durationSec } = parsed.data

  const pointsEarned = correctCount * 2
  const coinsEarned = Math.floor(pointsEarned / 10)

  const session = await db.studySession.create({
    data: {
      userId: user.id, deckId, mode: 'learn',
      cardsReviewed, newLearned,
      accuracy: cardsReviewed > 0 ? correctCount / cardsReviewed : 0,
      durationSec, pointsEarned, coinsEarned,
      endedAt: new Date(),
    },
  })

  if (coinsEarned > 0) {
    await db.user.update({ where: { id: user.id }, data: { coins: { increment: coinsEarned } } })
    await db.transaction.create({ data: { userId: user.id, type: 'earn', amount: coinsEarned, reason: 'round', refId: session.id } })
  }

  try {
    await bumpStreak(user.id, 'study')
    await bumpDailyProgress(user.id, 'cards', cardsReviewed)
    await bumpDailyProgress(user.id, 'points', pointsEarned)
  } catch (e) { console.error('streak/daily bump failed', e) }

  return NextResponse.json({ pointsEarned, coinsEarned })
}
