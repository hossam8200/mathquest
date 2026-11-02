// POST /api/admin/users/[id]/reset-password — reset a user's password
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { hashPassword } from '@/lib/crypto'

const Schema = z.object({ newPassword: z.string().min(4).max(64) })

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireRole('admin') } catch { return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) }
  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const user = await db.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  if (user.role === 'guest') return NextResponse.json({ error: 'GUEST_NO_PASSWORD' }, { status: 400 })

  await db.user.update({ where: { id }, data: { passwordHash: hashPassword(parsed.data.newPassword) } })
  return NextResponse.json({ ok: true })
}
