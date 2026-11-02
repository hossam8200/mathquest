// GET  /api/admin/characters — list all characters (including disabled).
// POST /api/admin/characters — create or update a character.
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

export async function GET() {
  try {
    await requireRole('admin')
  } catch {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }
  const chars = await db.character.findMany({ orderBy: [{ rarity: 'asc' }, { price: 'asc' }] })
  return NextResponse.json({ characters: chars })
}

const Schema = z.object({
  key: z.string().min(1),
  name: z.string().min(1).max(40),
  description: z.string().max(200),
  rarity: z.enum(['common', 'rare', 'epic', 'legendary']),
  price: z.number().int().min(0),
  artKind: z.enum(['svg', 'emoji']),
  artPayload: z.string(),
  perkType: z.enum(['hint', 'time', 'none']).nullable().optional(),
  perkValue: z.number().int().nullable().optional(),
  enabled: z.boolean().default(true),
})

export async function POST(req: Request) {
  try {
    await requireRole('admin')
  } catch {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const char = await db.character.upsert({
    where: { key: parsed.data.key },
    update: parsed.data,
    create: parsed.data,
  })
  return NextResponse.json({ character: char })
}
