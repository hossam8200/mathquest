// PATCH  /api/admin/cards/[id] — update a card (front, back, hint, explanation)
// DELETE /api/admin/cards/[id] — delete a card
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

const PatchSchema = z.object({
  front: z.string().min(1).optional(),
  back: z.string().min(1).optional(),
  hint: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireRole('admin') } catch { return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) }
  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const card = await db.card.update({ where: { id }, data: parsed.data })
  return NextResponse.json({ card })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireRole('admin') } catch { return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) }
  const { id } = await params
  await db.card.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
