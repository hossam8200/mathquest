// GET  /api/parent/family-goal — get the current family goal
// POST /api/parent/family-goal — set a new family goal
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const setting = await db.appSetting.findUnique({ where: { key: `family_goal_${user.id}` } })
  if (!setting) return NextResponse.json({ goal: null })
  return NextResponse.json({ goal: JSON.parse(setting.value) })
}

const Schema = z.object({
  type: z.enum(['days', 'levels', 'stars', 'boss']),
  target: z.number().int().min(1).max(30),
  reward: z.string().max(100),
})

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const goal = { ...parsed.data, childId: user.id, createdAt: new Date().toISOString() }
  await db.appSetting.upsert({
    where: { key: `family_goal_${user.id}` },
    update: { value: JSON.stringify(goal) },
    create: { key: `family_goal_${user.id}`, value: JSON.stringify(goal) },
  })
  return NextResponse.json({ goal })
}
