// GET /api/progress/daily — multiple simultaneous daily challenges.
// Returns 3 challenges (always available): cards, questions, levels.
// Each has a fun name, progress, and reward.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getOrCreateTodayChallenge } from '@/lib/daily'

const CHALLENGE_DEFS = [
  { type: 'cards', target: 20, rewardCoins: 30, name: 'Memory Master', emoji: '🃏', desc: 'Review 20 flashcards' },
  { type: 'questions', target: 25, rewardCoins: 40, name: 'Sharp Shooter', emoji: '🎯', desc: 'Answer 25 questions correctly' },
  { type: 'levels', target: 3, rewardCoins: 50, name: 'Level Crusher', emoji: '🗺️', desc: 'Complete 3 levels' },
]

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Ensure the rotating daily challenge exists (for backward compat)
  await getOrCreateTodayChallenge()

  // Compute progress for each challenge type from today's activity
  // 1. Cards reviewed today
  const todayCardReviews = await db.cardProgress.count({
    where: { userId: user.id, lastReviewed: { gte: todayStart } },
  })

  // 2. Correct answers today
  const todayCorrect = await db.questionResult.count({
    where: { userId: user.id, isCorrect: true, round: { createdAt: { gte: todayStart } } },
  })

  // 3. Levels passed today
  const todayPassed = await db.roundResult.findMany({
    where: { userId: user.id, score: { gte: 70 }, createdAt: { gte: todayStart } },
    select: { levelId: true },
    distinct: ['levelId'],
  })

  const progressMap: Record<string, number> = {
    cards: todayCardReviews,
    questions: todayCorrect,
    levels: todayPassed.length,
  }

  // Check which challenges have been claimed today
  const claimedKey = `daily_claimed_${user.id}_${todayStart.toISOString().slice(0, 10)}`
  const claimedSetting = await db.appSetting.findUnique({ where: { key: claimedKey } })
  const claimedSet = new Set<string>(claimedSetting ? JSON.parse(claimedSetting.value) : [])

  const challenges = CHALLENGE_DEFS.map(def => {
    const progress = Math.min(progressMap[def.type] ?? 0, def.target)
    const completed = progress >= def.target
    const claimed = claimedSet.has(def.type)
    return {
      ...def,
      progress,
      completed,
      claimed,
    }
  })

  return NextResponse.json({ challenges })
}
