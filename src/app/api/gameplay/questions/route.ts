// GET /api/gameplay/questions?levelId=...
// Generates fresh questions for the level using the user's age band, stores
// them in a RoundAttempt row (1-hour TTL), returns the questions + attemptId.
// The client never needs to send questions back — submit-round re-reads them.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { generateRound, type Operation } from '@/lib/math-engine'
import type { AgeBand } from '@/types'

const TTL_MS = 60 * 60 * 1000

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  if (!user.ageBand) return NextResponse.json({ error: 'NO_AGE_BAND' }, { status: 400 })

  const url = new URL(req.url)
  const levelId = url.searchParams.get('levelId')
  if (!levelId) return NextResponse.json({ error: 'MISSING_LEVEL' }, { status: 400 })

  const level = await db.level.findUnique({
    where: { id: levelId },
    include: { world: true },
  })
  if (!level) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  // Verify unlock
  if (level.levelNumber > 1) {
    const prev = await db.level.findFirst({
      where: { worldId: level.worldId, levelNumber: level.levelNumber - 1 },
    })
    if (prev) {
      const prevBest = await db.roundResult.findFirst({
        where: { userId: user.id, levelId: prev.id },
        orderBy: { score: 'desc' },
      })
      if (!prevBest || prevBest.score < prev.unlockThreshold) {
        return NextResponse.json({ error: 'LOCKED' }, { status: 403 })
      }
    }
  }

  const operation = level.world.key as Operation
  const ageBand = user.ageBand as AgeBand
  const questions = generateRound(operation, ageBand, level.difficulty, level.questionCount)

  // Clean up old expired attempts for this user (cheap garbage collection).
  await db.roundAttempt.deleteMany({
    where: { userId: user.id, expiresAt: { lt: new Date() } },
  })

  const attempt = await db.roundAttempt.create({
    data: {
      userId: user.id,
      levelId: level.id,
      questions: JSON.stringify(questions),
      expiresAt: new Date(Date.now() + TTL_MS),
    },
  })

  return NextResponse.json({
    attemptId: attempt.id,
    level: {
      id: level.id,
      title: level.title,
      isBoss: level.isBoss,
      questionCount: level.questionCount,
      difficulty: level.difficulty,
      worldName: level.world.name,
      worldEmoji: level.world.emoji,
      operation,
    },
    questions,
  })
}
