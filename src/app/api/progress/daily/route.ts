// GET /api/progress/daily — today's challenge + the user's progress.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getOrCreateTodayChallenge } from '@/lib/daily'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const challenge = await getOrCreateTodayChallenge()
  let progress = await db.userDailyProgress.findUnique({
    where: { userId_challengeId: { userId: user.id, challengeId: challenge.id } },
  })
  if (!progress) {
    progress = await db.userDailyProgress.create({
      data: { userId: user.id, challengeId: challenge.id, progress: 0, completed: false, claimed: false },
    })
  }
  return NextResponse.json({
    challenge: {
      id: challenge.id,
      type: challenge.type,
      target: challenge.target,
      rewardCoins: challenge.rewardCoins,
      date: challenge.date,
    },
    progress: {
      progress: progress.progress,
      completed: progress.completed,
      claimed: progress.claimed,
    },
  })
}
