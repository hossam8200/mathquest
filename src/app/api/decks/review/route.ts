// POST /api/decks/review — submit a flashcard review result.
// Body: { cardId, rating: 'again'|'hard'|'good'|'easy', wasCorrect }
// Applies SM-2, updates CardProgress, awards points, bumps streak + daily.
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { applyReview, initialSRState, type Rating } from '@/lib/spaced-repetition'
import { reviewReward } from '@/lib/scoring'
import { bumpStreak } from '@/lib/streaks'
import { bumpDailyProgress } from '@/lib/daily'

const Schema = z.object({
  cardId: z.string(),
  rating: z.enum(['again', 'hard', 'good', 'easy']),
  wasCorrect: z.boolean(),
})

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  const { cardId, rating, wasCorrect } = parsed.data

  const card = await db.card.findUnique({ where: { id: cardId } })
  if (!card) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  // Fetch or create CardProgress
  let prog = await db.cardProgress.findUnique({
    where: { userId_cardId: { userId: user.id, cardId } },
  })
  const prevState = prog
    ? {
        status: prog.status as 'new' | 'learning' | 'reviewing' | 'mastered',
        ease: prog.ease,
        interval: prog.interval,
        correctStreak: prog.correctStreak,
        totalReviews: prog.totalReviews,
        correctReviews: prog.correctReviews,
        lastReviewed: prog.lastReviewed,
        nextReview: prog.nextReview,
      }
    : initialSRState()

  const next = applyReview({ ...prevState, rating: rating as Rating, wasCorrect })

  if (prog) {
    prog = await db.cardProgress.update({
      where: { id: prog.id },
      data: {
        status: next.status,
        ease: next.ease,
        interval: next.interval,
        correctStreak: next.correctStreak,
        totalReviews: next.totalReviews,
        correctReviews: next.correctReviews,
        lastReviewed: next.lastReviewed,
        nextReview: next.nextReview,
      },
    })
  } else {
    prog = await db.cardProgress.create({
      data: {
        userId: user.id,
        cardId,
        status: next.status,
        ease: next.ease,
        interval: next.interval,
        correctStreak: next.correctStreak,
        totalReviews: next.totalReviews,
        correctReviews: next.correctReviews,
        lastReviewed: next.lastReviewed,
        nextReview: next.nextReview,
      },
    })
  }

  // Award points (small)
  const { points, coins } = reviewReward(wasCorrect)
  if (points > 0) {
    // Accumulate coins per session via StudySession (created by client at end).
    // For now, just track points; coins are awarded when the session ends.
  }

  // Best-effort: bump streak + daily on first review of the day
  try {
    await bumpStreak(user.id, 'study')
    await bumpDailyProgress(user.id, 'cards', 1)
  } catch (e) { console.error('streak/daily bump failed', e) }

  // Badge checks: 100 cards mastered
  try {
    const masteredCount = await db.cardProgress.count({
      where: { userId: user.id, status: 'mastered' },
    })
    if (masteredCount >= 100) {
      const badge = await db.badge.findUnique({ where: { key: 'cards_100' } })
      if (badge) {
        const existing = await db.userBadge.findUnique({
          where: { userId_badgeId: { userId: user.id, badgeId: badge.id } },
        })
        if (!existing) {
          await db.userBadge.create({ data: { userId: user.id, badgeId: badge.id } })
          if (badge.coinReward > 0) {
            await db.user.update({ where: { id: user.id }, data: { coins: { increment: badge.coinReward } } })
            await db.transaction.create({ data: { userId: user.id, type: 'earn', amount: badge.coinReward, reason: 'badge', refId: badge.id } })
          }
        }
      }
    }
    // First deck mastered
    if (next.status === 'mastered') {
      const deckCards = await db.card.findMany({ where: { deckId: card.deckId }, select: { id: true } })
      const masteredInDeck = await db.cardProgress.count({
        where: { userId: user.id, cardId: { in: deckCards.map((c) => c.id) }, status: 'mastered' },
      })
      if (masteredInDeck === deckCards.length) {
        const badge = await db.badge.findUnique({ where: { key: 'first_deck' } })
        if (badge) {
          const existing = await db.userBadge.findUnique({
            where: { userId_badgeId: { userId: user.id, badgeId: badge.id } },
          })
          if (!existing) {
            await db.userBadge.create({ data: { userId: user.id, badgeId: badge.id } })
            if (badge.coinReward > 0) {
              await db.user.update({ where: { id: user.id }, data: { coins: { increment: badge.coinReward } } })
              await db.transaction.create({ data: { userId: user.id, type: 'earn', amount: badge.coinReward, reason: 'badge', refId: badge.id } })
            }
          }
        }
      }
    }
  } catch (e) { console.error('badge check failed', e) }

  return NextResponse.json({
    status: next.status,
    nextReview: next.nextReview,
    interval: next.interval,
    ease: next.ease,
  })
}
