// GET /api/decks/due-cards?deckId=...&limit=20
// Returns due cards (nextReview <= now) + a few new cards.
// Supports a "weakOnly" flag to return only cards with status learning/reviewing
// (for the "Practice weak cards" button).
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const url = new URL(req.url)
  const deckId = url.searchParams.get('deckId')
  const limit = parseInt(url.searchParams.get('limit') ?? '20', 10)
  const weakOnly = url.searchParams.get('weakOnly') === 'true'
  if (!deckId) return NextResponse.json({ error: 'MISSING_DECK' }, { status: 400 })

  const cards = await db.card.findMany({
    where: { deckId },
    orderBy: { sortOrder: 'asc' },
  })
  if (cards.length === 0) return NextResponse.json({ cards: [], newCount: 0, dueCount: 0 })

  const progress = await db.cardProgress.findMany({
    where: { userId: user.id, cardId: { in: cards.map((c) => c.id) } },
  })
  const progByCard = new Map(progress.map((p) => [p.cardId, p]))
  const now = new Date()

  // Classify
  const newCards: typeof cards = []
  const due: typeof cards = []
  const weak: typeof cards = []
  for (const c of cards) {
    const p = progByCard.get(c.id)
    if (!p || p.status === 'new') {
      newCards.push(c)
    } else {
      if (p.nextReview <= now) due.push(c)
      if (p.status === 'learning' || p.status === 'reviewing') weak.push(c)
    }
  }

  let selected: typeof cards
  if (weakOnly) {
    selected = weak.slice(0, limit)
  } else {
    // Mix: up to 5 new cards + due cards, ordered by most overdue
    const newOnes = newCards.slice(0, 5)
    const dueSorted = due.sort((a, b) => {
      const pa = progByCard.get(a.id)!.nextReview.getTime()
      const pb = progByCard.get(b.id)!.nextReview.getTime()
      return pa - pb
    })
    selected = [...newOnes, ...dueSorted].slice(0, limit)
  }

  // Attach progress status
  const result = selected.map((c) => {
    const p = progByCard.get(c.id)
    return {
      id: c.id,
      deckId: c.deckId,
      front: c.front,
      back: c.back,
      hint: c.hint,
      explanation: c.explanation,
      sortOrder: c.sortOrder,
      status: p?.status ?? 'new',
    }
  })

  return NextResponse.json({
    cards: result,
    newCount: newCards.length,
    dueCount: due.length,
    weakCount: weak.length,
  })
}
