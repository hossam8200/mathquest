// GET    /api/decks/[id] — deck detail with cards + per-card progress
// PUT    /api/decks/[id] — update deck (title, description, coverIcon)
// DELETE /api/decks/[id] — delete custom deck (built-in cannot be deleted)
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { CardInfo } from '@/types'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { id } = await params

  const deck = await db.deck.findUnique({
    where: { id },
    include: { cards: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!deck) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  if (!deck.isBuiltIn && deck.ownerId !== user.id && !deck.isPublic) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  const progress = await db.cardProgress.findMany({
    where: { userId: user.id, cardId: { in: deck.cards.map((c) => c.id) } },
    select: { cardId: true, status: true },
  })
  const statusByCard = new Map(progress.map((p) => [p.cardId, p.status]))

  const cards: CardInfo[] = deck.cards.map((c) => ({
    id: c.id,
    deckId: c.deckId,
    front: c.front,
    back: c.back,
    hint: c.hint,
    explanation: c.explanation,
    sortOrder: c.sortOrder,
    status: (statusByCard.get(c.id) ?? 'new') as CardInfo['status'],
  }))

  return NextResponse.json({
    deck: {
      id: deck.id,
      title: deck.title,
      description: deck.description,
      coverIcon: deck.coverIcon,
      operation: deck.operation,
      ageBand: deck.ageBand,
      isBuiltIn: deck.isBuiltIn,
      isCustom: !deck.isBuiltIn,
      cardCount: cards.length,
    },
    cards,
  })
}

const UpdateSchema = z.object({
  title: z.string().min(1).max(60).optional(),
  description: z.string().max(200).optional(),
  coverIcon: z.string().max(4).optional(),
})

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { id } = await params

  const deck = await db.deck.findUnique({ where: { id } })
  if (!deck) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  if (deck.isBuiltIn) return NextResponse.json({ error: 'CANNOT_EDIT_BUILTIN' }, { status: 403 })
  if (deck.ownerId !== user.id) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const updated = await db.deck.update({ where: { id }, data: parsed.data })
  return NextResponse.json({ deck: updated })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { id } = await params

  const deck = await db.deck.findUnique({ where: { id } })
  if (!deck) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  if (deck.isBuiltIn) return NextResponse.json({ error: 'CANNOT_DELETE_BUILTIN' }, { status: 403 })
  if (deck.ownerId !== user.id) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  await db.deck.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
