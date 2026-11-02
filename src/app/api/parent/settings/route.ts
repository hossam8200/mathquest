// POST /api/parent/settings — update daily time limit + card goal.
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const Schema = z.object({
  dailyTimeLimitMins: z.number().int().min(5).max(480).optional(),
  dailyCardGoal: z.number().int().min(5).max(100).optional(),
})

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const data: { dailyTimeLimitMins?: number; dailyCardGoal?: number } = {}
  if (parsed.data.dailyTimeLimitMins !== undefined) data.dailyTimeLimitMins = parsed.data.dailyTimeLimitMins
  if (parsed.data.dailyCardGoal !== undefined) data.dailyCardGoal = parsed.data.dailyCardGoal

  await db.user.update({ where: { id: user.id }, data })
  return NextResponse.json({ ok: true })
}
