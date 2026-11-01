// POST /api/parent/assign-deck — assign or unassign a built-in deck.
// Body: { deckId, assign: boolean }
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const Schema = z.object({ deckId: z.string(), assign: z.boolean() })

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  const { deckId, assign } = parsed.data

  const deck = await db.deck.findUnique({ where: { id: deckId } })
  if (!deck) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  if (assign) {
    await db.user.update({
      where: { id: user.id },
      data: { assignedDecks: { connect: { id: deckId } } },
    })
  } else {
    await db.user.update({
      where: { id: user.id },
      data: { assignedDecks: { disconnect: { id: deckId } } },
    })
  }
  return NextResponse.json({ ok: true, assigned: assign })
}
