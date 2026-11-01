// POST /api/admin/csv-import — bulk import cards into a deck from CSV text.
// Body: { deckId, csv }
// CSV format: front,back,hint,explanation (hint + explanation optional)
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

const Schema = z.object({ deckId: z.string(), csv: z.string().min(1) })

function parseCSV(text: string): { front: string; back: string; hint?: string; explanation?: string }[] {
  const lines = text.trim().split('\n')
  const rows: { front: string; back: string; hint?: string; explanation?: string }[] = []
  // Skip header if it looks like one
  const first = lines[0]?.toLowerCase() ?? ''
  const startIdx = first.includes('front') && first.includes('back') ? 1 : 0
  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].split(',').map((s) => s.trim().replace(/^"|"$/g, ''))
    if (parts.length < 2) continue
    rows.push({
      front: parts[0],
      back: parts[1],
      hint: parts[2] || undefined,
      explanation: parts[3] || undefined,
    })
  }
  return rows
}

export async function POST(req: Request) {
  try {
    await requireRole('admin')
  } catch {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const deck = await db.deck.findUnique({ where: { id: parsed.data.deckId } })
  if (!deck) return NextResponse.json({ error: 'DECK_NOT_FOUND' }, { status: 404 })

  const rows = parseCSV(parsed.data.csv)
  if (rows.length === 0) return NextResponse.json({ error: 'NO_ROWS' }, { status: 400 })

  const maxSort = await db.card.findFirst({
    where: { deckId: deck.id },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })
  let sort = (maxSort?.sortOrder ?? -1) + 1

  await db.card.createMany({
    data: rows.map((r) => ({
      deckId: deck.id,
      front: r.front,
      back: r.back,
      hint: r.hint ?? null,
      explanation: r.explanation ?? null,
      sortOrder: sort++,
    })),
  })

  return NextResponse.json({ imported: rows.length })
}
