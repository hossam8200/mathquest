// POST /api/progress/daily/claim — claim a specific daily challenge reward.
// Body: { type: 'cards' | 'questions' | 'levels' }
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const Schema = z.object({ type: z.enum(['cards', 'questions', 'levels']) })

const REWARDS: Record<string, number> = {
  cards: 30,
  questions: 40,
  levels: 50,
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  const { type } = parsed.data
  const rewardCoins = REWARDS[type]

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const claimedKey = `daily_claimed_${user.id}_${todayStart.toISOString().slice(0, 10)}`

  // Check current claimed state
  const existing = await db.appSetting.findUnique({ where: { key: claimedKey } })
  const claimedSet = new Set<string>(existing ? JSON.parse(existing.value) : [])

  if (claimedSet.has(type)) {
    return NextResponse.json({ error: 'ALREADY_CLAIMED' }, { status: 400 })
  }

  // Verify the challenge is actually completed
  let progress = 0
  const targets: Record<string, number> = { cards: 20, questions: 25, levels: 3 }
  if (type === 'cards') {
    progress = await db.cardProgress.count({ where: { userId: user.id, lastReviewed: { gte: todayStart } } })
  } else if (type === 'questions') {
    progress = await db.questionResult.count({ where: { userId: user.id, isCorrect: true, round: { createdAt: { gte: todayStart } } } })
  } else if (type === 'levels') {
    const passed = await db.roundResult.findMany({ where: { userId: user.id, score: { gte: 70 }, createdAt: { gte: todayStart } }, select: { levelId: true }, distinct: ['levelId'] })
    progress = passed.length
  }

  if (progress < targets[type]) {
    return NextResponse.json({ error: 'NOT_COMPLETED', progress, target: targets[type] }, { status: 400 })
  }

  // Claim it — add to claimed set + award coins
  claimedSet.add(type)
  await db.appSetting.upsert({
    where: { key: claimedKey },
    update: { value: JSON.stringify([...claimedSet]) },
    create: { key: claimedKey, value: JSON.stringify([type]) },
  })

  await db.user.update({ where: { id: user.id }, data: { coins: { increment: rewardCoins } } })
  await db.transaction.create({ data: { userId: user.id, type: 'earn', amount: rewardCoins, reason: 'daily' } })

  return NextResponse.json({ ok: true, rewardCoins })
}
