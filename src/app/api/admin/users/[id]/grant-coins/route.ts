// POST /api/admin/users/[id]/grant-coins — grant coins to a user
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

const Schema = z.object({ amount: z.number().int().min(-1000).max(10000), reason: z.string().optional() })

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireRole('admin') } catch { return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) }
  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  const { amount, reason } = parsed.data

  const user = await db.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  await db.$transaction([
    db.user.update({ where: { id }, data: { coins: { increment: amount } } }),
    db.transaction.create({ data: { userId: id, type: amount > 0 ? 'earn' : 'spend', amount: Math.abs(amount), reason: reason || 'admin_grant' } }),
  ])

  const updated = await db.user.findUnique({ where: { id }, select: { coins: true } })
  return NextResponse.json({ ok: true, coins: updated?.coins })
}
