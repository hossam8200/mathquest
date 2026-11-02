// GET /api/admin/analytics — chart data for admin dashboard
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

export async function GET() {
  try { await requireRole('admin') } catch { return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) }

  // User growth (last 14 days, cumulative)
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const users = await db.user.findMany({
    where: { createdAt: { gte: fourteenDaysAgo }, role: { not: 'guest' } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  const userGrowth: { date: string; count: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    const count = users.filter(u => u.createdAt >= d && u.createdAt < next).length
    userGrowth.push({ date: d.toISOString().slice(5, 10), count })
  }

  // Daily active users (last 7 days) — users with activity
  const rounds = await db.roundResult.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    select: { userId: true, createdAt: true },
  })
  const sessions = await db.studySession.findMany({
    where: { startedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    select: { userId: true, startedAt: true },
  })
  const dau: { date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    const activeUsers = new Set<string>()
    rounds.filter(r => r.createdAt >= d && r.createdAt < next).forEach(r => activeUsers.add(r.userId))
    sessions.filter(s => s.startedAt >= d && s.startedAt < next).forEach(s => activeUsers.add(s.userId))
    dau.push({ date: d.toISOString().slice(5, 10), count: activeUsers.size })
  }

  // Most played levels (top 10)
  const levelPlayCounts = await db.roundResult.groupBy({
    by: ['levelId'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  })
  const levelIds = levelPlayCounts.map(l => l.levelId)
  const levels = await db.level.findMany({ where: { id: { in: levelIds } }, select: { id: true, title: true, levelNumber: true, world: { select: { name: true, emoji: true } } } })
  const popularLevels = levelPlayCounts.map(lc => {
    const level = levels.find(l => l.id === lc.levelId)
    return { title: level ? `${level.world.emoji} ${level.title}` : lc.levelId, plays: lc._count.id }
  })

  // Most popular characters (purchases count)
  const charPurchases = await db.purchase.groupBy({
    by: ['characterId'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  })
  const charIds = charPurchases.map(c => c.characterId)
  const chars = await db.character.findMany({ where: { id: { in: charIds } }, select: { id: true, name: true, artPayload: true, rarity: true } })
  const popularCharacters = charPurchases.map(cp => {
    const char = chars.find(c => c.id === cp.characterId)
    return { name: char?.name ?? cp.characterId, emoji: char?.artPayload ?? '❓', buys: cp._count.id }
  })

  // Coin flow (earned vs spent, last 7 days)
  const transactions = await db.transaction.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    select: { type: true, amount: true, createdAt: true },
  })
  const coinFlow: { date: string; earned: number; spent: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    const dayTxns = transactions.filter(t => t.createdAt >= d && t.createdAt < next)
    coinFlow.push({
      date: d.toISOString().slice(5, 10),
      earned: dayTxns.filter(t => t.type === 'earn').reduce((s, t) => s + t.amount, 0),
      spent: dayTxns.filter(t => t.type === 'spend').reduce((s, t) => s + t.amount, 0),
    })
  }

  // Summary stats
  const [totalUsers, totalRounds, totalSessions, totalPurchases, coinsInCirculation, bannedCount] = await Promise.all([
    db.user.count({ where: { role: { not: 'guest' } } }),
    db.roundResult.count(),
    db.studySession.count(),
    db.purchase.count(),
    db.user.aggregate({ _sum: { coins: true }, where: { role: { not: 'guest' } } }),
    db.user.count({ where: { banned: true } }),
  ])

  return NextResponse.json({
    summary: { totalUsers, totalRounds, totalSessions, totalPurchases, coinsInCirculation: coinsInCirculation._sum.coins ?? 0, bannedCount },
    userGrowth,
    dau,
    popularLevels,
    popularCharacters,
    coinFlow,
  })
}
