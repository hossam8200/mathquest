// POST /api/admin/bulk-grant — grant coins to all non-guest users
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

const Schema = z.object({
  amount: z.number().int().min(1).max(500),
  reason: z.string().optional(),
})

export async function POST(req: Request) {
  try { await requireRole('admin') } catch { return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) }
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  const { amount, reason } = parsed.data

  const users = await db.user.findMany({ where: { role: { not: 'guest' }, banned: false }, select: { id: true } })
  if (users.length === 0) return NextResponse.json({ ok: true, count: 0 })

  // Grant coins + create transactions in batch
  await db.$transaction([
    ...users.map(u => db.user.update({ where: { id: u.id }, data: { coins: { increment: amount } } })),
    ...users.map(u => db.transaction.create({ data: { userId: u.id, type: 'earn', amount, reason: reason || 'admin_bulk_grant' } })),
  ])

  return NextResponse.json({ ok: true, count: users.length })
}
