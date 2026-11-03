// POST /api/parent/reset-progress — delete ALL progress data for this child (keeps account)
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  // Delete all progress data in order (respecting foreign keys)
  await db.$transaction([
    db.questionResult.deleteMany({ where: { userId: user.id } }),
    db.roundResult.deleteMany({ where: { userId: user.id } }),
    db.studySession.deleteMany({ where: { userId: user.id } }),
    db.matchScore.deleteMany({ where: { userId: user.id } }),
    db.cardProgress.deleteMany({ where: { userId: user.id } }),
    db.userBadge.deleteMany({ where: { userId: user.id } }),
    db.transaction.deleteMany({ where: { userId: user.id } }),
    db.parentQuest.deleteMany({ where: { childId: user.id } }),
    db.purchase.deleteMany({ where: { userId: user.id } }),
    db.userDailyProgress.deleteMany({ where: { userId: user.id } }),
    // Reset streaks
    db.streak.updateMany({ where: { userId: user.id }, data: { current: 0 } }),
    // Reset coins
    db.user.update({ where: { id: user.id }, data: { coins: 0, loginStreak: 0 } }),
    // Remove family goal
    db.appSetting.deleteMany({ where: { key: `family_goal_${user.id}` } }),
  ])

  return NextResponse.json({ ok: true, message: 'All progress reset' })
}
