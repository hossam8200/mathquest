// GET /api/admin/stats — usage statistics.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

export async function GET() {
  try {
    await requireRole('admin')
  } catch {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }
  const [totalUsers, totalRounds, totalSessions, totalPurchases, totalCards, totalDecks] = await Promise.all([
    db.user.count({ where: { role: { not: 'guest' } } }),
    db.roundResult.count(),
    db.studySession.count(),
    db.purchase.count(),
    db.card.count(),
    db.deck.count(),
  ])
  const coinsInCirculation = await db.user.aggregate({ _sum: { coins: true } })
  return NextResponse.json({
    totalUsers, totalRounds, totalSessions, totalPurchases, totalCards, totalDecks,
    coinsInCirculation: coinsInCirculation._sum.coins ?? 0,
  })
}
