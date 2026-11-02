// POST /api/marketplace/equip — equip an owned character as avatar.
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const Schema = z.object({ characterId: z.string() })

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const char = await db.character.findUnique({ where: { id: parsed.data.characterId } })
  if (!char || !char.enabled) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  // Must own it (or it's a free starter)
  if (char.price > 0) {
    const purchase = await db.purchase.findUnique({
      where: { userId_characterId: { userId: user.id, characterId: char.id } },
    })
    if (!purchase) return NextResponse.json({ error: 'NOT_OWNED' }, { status: 403 })
  }

  await db.user.update({ where: { id: user.id }, data: { avatarCharacterId: char.id } })
  return NextResponse.json({ ok: true })
}
