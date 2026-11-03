// GET  /api/quests — get active quests for the logged-in child
// POST /api/quests/[id]/complete — complete a quest (called by submit-round when a level is passed)
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const activeQuests = await db.parentQuest.findMany({
    where: { childId: user.id, completed: false },
    orderBy: { createdAt: 'desc' },
  })

  // Calculate progress for each quest (how many levels of this operation completed)
  const questsWithProgress = await Promise.all(
    activeQuests.map(async (q) => {
      const completedRounds = await db.roundResult.findMany({
        where: {
          userId: user.id,
          score: { gte: 70 },
          level: { world: { key: q.operation } },
          createdAt: { gte: q.createdAt },
        },
        select: { id: true, levelId: true },
        distinct: ['levelId'],
      })
      const progress = completedRounds.length
      const isComplete = progress >= q.target
      return { ...q, progress, isComplete }
    })
  )

  // Auto-complete any quests that reached their target
  for (const q of questsWithProgress) {
    if (q.isComplete) {
      await db.parentQuest.update({
        where: { id: q.id },
        data: { completed: true, completedAt: new Date() },
      })
      // Award coins
      await db.user.update({ where: { id: user.id }, data: { coins: { increment: q.rewardCoins } } })
      await db.transaction.create({
        data: { userId: user.id, type: 'earn', amount: q.rewardCoins, reason: 'parent_quest', refId: q.id },
      })
    }
  }

  return NextResponse.json({
    quests: questsWithProgress.map(q => ({
      id: q.id, operation: q.operation, target: q.target, rewardCoins: q.rewardCoins,
      message: q.message, progress: q.progress, isComplete: q.isComplete,
    })),
  })
}
