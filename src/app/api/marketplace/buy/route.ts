// POST /api/marketplace/buy — purchase a character.
// Guards: sufficient coins, not already owned, character enabled.
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

  // Duplicate check
  const existing = await db.purchase.findUnique({
    where: { userId_characterId: { userId: user.id, characterId: char.id } },
  })
  if (existing || char.price === 0) {
    return NextResponse.json({ error: 'ALREADY_OWNED' }, { status: 409 })
  }

  // Balance check
  if (user.coins < char.price) {
    return NextResponse.json({ error: 'INSUFFICIENT_COINS' }, { status: 402 })
  }

  // Atomic purchase
  await db.$transaction([
    db.purchase.create({ data: { userId: user.id, characterId: char.id, pricePaid: char.price } }),
    db.user.update({ where: { id: user.id }, data: { coins: { decrement: char.price } } }),
    db.transaction.create({ data: { userId: user.id, type: 'spend', amount: char.price, reason: 'purchase', refId: char.id } }),
  ])

  return NextResponse.json({ ok: true, coinsRemaining: user.coins - char.price })
}
