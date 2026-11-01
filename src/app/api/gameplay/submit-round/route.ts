// POST /api/gameplay/submit-round
// Body: { attemptId, answers: [{ idx, userAnswer, timeMs }], durationMs, bestStreak }
//
// Server flow:
//   1. Fetch RoundAttempt (must exist + not expired + belong to user).
//   2. Re-validate each answer via checkAnswer.
//   3. Compute correctCount, score, stars, points, coins via scoreRound.
//   4. Persist RoundResult + QuestionResults.
//   5. Award coins + transaction row.
//   6. Bump study streak + daily challenge (levels + points).
//   7. Award badges if newly earned.
//   8. Delete the attempt.
//   9. Return summary.
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { checkAnswer, type Question } from '@/lib/math-engine'
import { scoreRound } from '@/lib/scoring'
import { bumpStreak } from '@/lib/streaks'
import { bumpDailyProgress } from '@/lib/daily'

const Schema = z.object({
  attemptId: z.string(),
  answers: z.array(z.object({
    idx: z.number().int().min(0),
    userAnswer: z.string().nullable().optional(),
    timeMs: z.number().int().min(0),
  })),
  durationMs: z.number().int().min(0),
  bestStreak: z.number().int().min(0),
})

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }
  const { attemptId, answers, durationMs, bestStreak } = parsed.data

  const attempt = await db.roundAttempt.findUnique({ where: { id: attemptId } })
  if (!attempt || attempt.userId !== user.id) {
    return NextResponse.json({ error: 'ATTEMPT_NOT_FOUND' }, { status: 404 })
  }
  if (attempt.expiresAt < new Date()) {
    await db.roundAttempt.delete({ where: { id: attemptId } })
    return NextResponse.json({ error: 'ATTEMPT_EXPIRED' }, { status: 410 })
  }

  const questions: Question[] = JSON.parse(attempt.questions)
  if (answers.length !== questions.length) {
    return NextResponse.json({ error: 'ANSWER_COUNT_MISMATCH' }, { status: 400 })
  }

  // Re-validate answers server-side
  let correctCount = 0
  const questionResults: { questionIdx: number; operation: string; prompt: string; userAnswer: string | null; correctAnswer: string; isCorrect: boolean; timeMs: number }[] = []
  for (const a of answers) {
    const q = questions[a.idx]
    if (!q) return NextResponse.json({ error: 'BAD_INDEX' }, { status: 400 })
    const isCorrect = checkAnswer(q, a.userAnswer)
    if (isCorrect) correctCount++
    questionResults.push({
      questionIdx: a.idx,
      operation: q.operation,
      prompt: q.prompt,
      userAnswer: a.userAnswer ?? null,
      correctAnswer: String(q.answer),
      isCorrect,
      timeMs: a.timeMs,
    })
  }

  const score = scoreRound({
    correctCount,
    totalCount: questions.length,
    durationMs,
    bestStreak,
  })

  // Persist result + per-question results in a transaction with coin award.
  const roundResult = await db.$transaction(async (tx) => {
    const rr = await tx.roundResult.create({
      data: {
        userId: user.id,
        levelId: attempt.levelId,
        score: score.percent,
        stars: score.stars,
        correctCount,
        totalCount: questions.length,
        durationMs,
        pointsEarned: score.pointsEarned,
        coinsEarned: score.coinsEarned,
        bestStreak,
      },
    })
    await tx.questionResult.createMany({
      data: questionResults.map((qr) => ({ ...qr, roundId: rr.id, userId: user.id })),
    })
    if (score.coinsEarned > 0) {
      await tx.user.update({ where: { id: user.id }, data: { coins: { increment: score.coinsEarned } } })
      await tx.transaction.create({
        data: { userId: user.id, type: 'earn', amount: score.coinsEarned, reason: 'round', refId: rr.id },
      })
    }
    return rr
  })

  // Side-effects: streak + daily + badges (best-effort, non-blocking failures)
  try {
    await bumpStreak(user.id, 'study')
  } catch (e) { console.error('streak bump failed', e) }

  try {
    await bumpDailyProgress(user.id, 'levels', 1)
    await bumpDailyProgress(user.id, 'points', score.pointsEarned)
  } catch (e) { console.error('daily bump failed', e) }

  // Badge checks
  const newBadges: { key: string; name: string; emoji: string; coinReward: number }[] = []
  try {
    const allRoundResults = await db.roundResult.findMany({
      where: { userId: user.id },
      select: { id: true, score: true, levelId: true, createdAt: true },
    })
    const earnedKeys = new Set(
      (await db.userBadge.findMany({ where: { userId: user.id }, select: { badgeId: true } }))
        .map((ub) => ub.badgeId)
    )
    const allBadges = await db.badge.findMany()
    const byKey = (k: string) => allBadges.find((b) => b.key === k)
    const tryAward = async (k: string, cond: boolean) => {
      if (!cond || earnedKeys.has(byKey(k)?.id ?? '')) return
      const b = byKey(k)
      if (!b) return
      await db.userBadge.create({ data: { userId: user.id, badgeId: b.id } })
      if (b.coinReward > 0) {
        await db.user.update({ where: { id: user.id }, data: { coins: { increment: b.coinReward } } })
        await db.transaction.create({ data: { userId: user.id, type: 'earn', amount: b.coinReward, reason: 'badge', refId: b.id } })
      }
      newBadges.push({ key: b.key, name: b.name, emoji: b.emoji, coinReward: b.coinReward })
    }
    await tryAward('first_level', allRoundResults.length >= 1)
    await tryAward('ten_levels', allRoundResults.filter(r => r.score >= 70).length >= 10)
    await tryAward('perfect_round', score.percent === 100)
    // First boss beaten?
    if (score.percent >= 70) {
      const level = await db.level.findUnique({ where: { id: attempt.levelId } })
      if (level?.isBoss) await tryAward('first_boss', true)
      // All 5 bosses beaten?
      const bossLevels = await db.level.findMany({ where: { isBoss: true }, select: { id: true } })
      const bossResults = await db.roundResult.findMany({
        where: { userId: user.id, levelId: { in: bossLevels.map(b => b.id) }, score: { gte: 70 } },
        select: { levelId: true },
      })
      const beatenBossWorlds = new Set(bossResults.map(r => r.levelId))
      if (bossLevels.every(b => beatenBossWorlds.has(b.id))) await tryAward('all_worlds', true)
    }
    // Coins milestone
    const totalCoinsEarned = await db.transaction.aggregate({
      where: { userId: user.id, type: 'earn' },
      _sum: { amount: true },
    })
    await tryAward('coins_500', (totalCoinsEarned._sum.amount ?? 0) >= 500)
  } catch (e) { console.error('badge check failed', e) }

  // Clean up the attempt
  await db.roundAttempt.delete({ where: { id: attemptId } }).catch(() => {})

  // Compute next-level unlock state: did this passing run unlock the next level?
  let unlockedNext = false
  const levelRow = await db.level.findUnique({
    where: { id: attempt.levelId },
    select: { worldId: true, levelNumber: true, unlockThreshold: true },
  })
  if (levelRow && score.passed && levelRow.levelNumber < 30) {
    // Newly unlocked only if the user hasn't previously unlocked it.
    const next = await db.level.findFirst({
      where: { worldId: levelRow.worldId, levelNumber: levelRow.levelNumber + 1 },
      select: { id: true },
    })
    if (next) {
      const alreadyUnlocked = await db.roundResult.findFirst({
        where: { userId: user.id, levelId: attempt.levelId, score: { gte: levelRow.unlockThreshold } },
        select: { id: true },
      })
      // If this round's score crossed the threshold, consider it "unlocked next"
      unlockedNext = score.percent >= levelRow.unlockThreshold && !alreadyUnlocked
    }
  }

  return NextResponse.json({
    roundId: roundResult.id,
    percent: score.percent,
    stars: score.stars,
    pointsEarned: score.pointsEarned,
    coinsEarned: score.coinsEarned,
    passed: score.passed,
    correctCount,
    totalCount: questions.length,
    newBadges,
    unlockedNext,
  })
}
