// GET  /api/decks — list built-in + user's custom decks with mastery summary.
// POST /api/decks — create a custom deck.
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { DeckInfo } from '@/types'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  // Built-in decks (filter to user's age band) + user's custom decks
  const builtin = await db.deck.findMany({
    where: { isBuiltIn: true, ageBand: user.ageBand ?? '8-10' },
    include: { _count: { select: { cards: true } } },
    orderBy: [{ operation: 'asc' }, { title: 'asc' }],
  })
  const custom = await db.deck.findMany({
    where: { ownerId: user.id },
    include: { _count: { select: { cards: true } } },
    orderBy: { title: 'asc' },
  })

  // Parent-assigned decks
  const assigned = await db.deck.findMany({
    where: { assignedTo: { some: { id: user.id } } },
    select: { id: true },
  })
  const assignedIds = new Set(assigned.map((d) => d.id))

  // Mastery per deck
  const allDeckIds = [...builtin.map((d) => d.id), ...custom.map((d) => d.id)]
  const progress = await db.cardProgress.findMany({
    where: { userId: user.id, card: { deckId: { in: allDeckIds } } },
    select: { status: true, card: { select: { deckId: true } } },
  })
  const byDeck = new Map<string, { new: number; learning: number; reviewing: number; mastered: number }>()
  for (const p of progress) {
    const entry = byDeck.get(p.card.deckId) ?? { new: 0, learning: 0, reviewing: 0, mastered: 0 }
    entry[p.status as keyof typeof entry]++
    byDeck.set(p.card.deckId, entry)
  }

  // Best match times
  const matchScores = await db.matchScore.findMany({
    where: { userId: user.id },
    select: { deckId: true, timeSec: true },
    orderBy: { timeSec: 'asc' },
  })
  const bestMatchTime = new Map<string, number>()
  for (const m of matchScores) {
    if (!bestMatchTime.has(m.deckId)) bestMatchTime.set(m.deckId, m.timeSec)
  }

  const toInfo = (d: typeof builtin[number]): DeckInfo => {
    const counts = byDeck.get(d.id) ?? { new: 0, learning: 0, reviewing: 0, mastered: 0 }
    const total = d._count.cards
    const masteryPct = total > 0 ? Math.round((counts.mastered / total) * 100) : 0
    return {
      id: d.id,
      title: d.title,
      description: d.description,
      coverIcon: d.coverIcon,
      operation: d.operation as DeckInfo['operation'],
      ageBand: d.ageBand as DeckInfo['ageBand'],
      isBuiltIn: d.isBuiltIn,
      isCustom: !d.isBuiltIn,
      cardCount: total,
      masteryPct,
      counts,
      bestMatchTimeSec: bestMatchTime.get(d.id) ?? null,
      assignedByParent: assignedIds.has(d.id),
    }
  }

  return NextResponse.json({
    decks: [...builtin.map(toInfo), ...custom.map(toInfo)],
  })
}

const CreateSchema = z.object({
  title: z.string().min(1).max(60),
  description: z.string().max(200).optional().default(''),
  coverIcon: z.string().max(4).optional().default('📚'),
  operation: z.enum(['addition', 'subtraction', 'multiplication', 'division', 'mixed']).default('mixed'),
  ageBand: z.enum(['8-10', '11-13', '14-16']).default('8-10'),
})

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const deck = await db.deck.create({
    data: {
      ownerId: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      coverIcon: parsed.data.coverIcon,
      operation: parsed.data.operation,
      ageBand: parsed.data.ageBand,
      isBuiltIn: false,
      isPublic: false,
    },
  })
  await db.userDeck.create({ data: { userId: user.id, deckId: deck.id, isCustom: true } })
  return NextResponse.json({ deck })
}
