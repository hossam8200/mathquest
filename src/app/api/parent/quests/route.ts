// GET  /api/parent/quests — list all quests for this child
// POST /api/parent/quests — create a new parent quest
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const quests = await db.parentQuest.findMany({
    where: { childId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })
  return NextResponse.json({ quests })
}

const Schema = z.object({
  operation: z.enum(['addition', 'subtraction', 'multiplication', 'division', 'mixed']),
  target: z.number().int().min(1).max(10).default(3),
  rewardCoins: z.number().int().min(10).max(500).default(50),
  message: z.string().max(200).optional(),
})

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const { operation, target, rewardCoins, message } = parsed.data
  const opLabel = { addition: '➕', subtraction: '➖', multiplication: '✖️', division: '➗', mixed: '🎲' }[operation]
  const finalMessage = message || `🛡️ A Special Quest from your Parent! Complete ${target} ${operation} levels to earn ${rewardCoins} bonus coins!`

  // Deactivate existing incomplete quests for the same operation
  await db.parentQuest.updateMany({
    where: { childId: user.id, operation, completed: false },
    data: { completed: true, completedAt: new Date() },
  })

  const quest = await db.parentQuest.create({
    data: { childId: user.id, operation, target, rewardCoins, message: finalMessage },
  })
  return NextResponse.json({ quest })
}
