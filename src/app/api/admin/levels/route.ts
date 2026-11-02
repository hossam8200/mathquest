// GET  /api/admin/levels — list all levels with world info + play counts
// PATCH /api/admin/levels — batch update level settings
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

export async function GET() {
  try { await requireRole('admin') } catch { return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) }
  const levels = await db.level.findMany({
    include: {
      world: { select: { name: true, emoji: true, key: true } },
      _count: { select: { roundResults: true } },
    },
    orderBy: [{ world: { sortOrder: 'asc' } }, { levelNumber: 'asc' }],
  })
  return NextResponse.json({ levels })
}

const PatchSchema = z.object({
  id: z.string(),
  difficulty: z.number().int().min(1).max(10).optional(),
  title: z.string().min(1).max(60).optional(),
  isBoss: z.boolean().optional(),
  questionCount: z.number().int().min(5).max(20).optional(),
  unlockThreshold: z.number().int().min(50).max(100).optional(),
  enabled: z.boolean().optional(),
})

export async function PATCH(req: Request) {
  try { await requireRole('admin') } catch { return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) }
  const body = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const { id, ...data } = parsed.data
  const level = await db.level.update({ where: { id }, data })
  return NextResponse.json({ level })
}
