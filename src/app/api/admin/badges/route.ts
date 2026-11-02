// GET  /api/admin/badges — list all badges with earned counts
// POST /api/admin/badges — create or update a badge
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

export async function GET() {
  try { await requireRole('admin') } catch { return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) }
  const badges = await db.badge.findMany({
    include: { _count: { select: { userBadges: true } } },
    orderBy: { coinReward: 'asc' },
  })
  return NextResponse.json({ badges })
}

const Schema = z.object({
  key: z.string().min(1),
  name: z.string().min(1).max(40),
  description: z.string().max(200),
  emoji: z.string().max(4),
  coinReward: z.number().int().min(0).max(1000),
})

export async function POST(req: Request) {
  try { await requireRole('admin') } catch { return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) }
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const badge = await db.badge.upsert({
    where: { key: parsed.data.key },
    update: parsed.data,
    create: parsed.data,
  })
  return NextResponse.json({ badge })
}
