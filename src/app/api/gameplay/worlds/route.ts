// GET /api/gameplay/worlds — list all worlds with level counts and the
// current user's completion summary.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, requireUser } from '@/lib/auth'
import type { WorldInfo } from '@/types'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const worlds = await db.world.findMany({ orderBy: { sortOrder: 'asc' } })
  const result: (WorldInfo & { totalLevels: number; completedLevels: number; bestStarsSum: number })[] = []
  for (const w of worlds) {
    const levels = await db.level.findMany({ where: { worldId: w.id }, orderBy: { levelNumber: 'asc' } })
    const bestResults = await db.roundResult.findMany({
      where: { userId: user.id, levelId: { in: levels.map(l => l.id) } },
      select: { levelId: true, stars: true, score: true },
    })
    // Best stars per level
    const bestByLevel = new Map<string, number>()
    for (const r of bestResults) {
      const cur = bestByLevel.get(r.levelId) ?? 0
      if (r.stars > cur) bestByLevel.set(r.levelId, r.stars)
    }
    const completedLevels = [...bestByLevel.values()].filter(s => s > 0).length
    result.push({
      id: w.id,
      key: w.key as WorldInfo['key'],
      name: w.name,
      emoji: w.emoji,
      sortOrder: w.sortOrder,
      totalLevels: levels.length,
      completedLevels,
      bestStarsSum: [...bestByLevel.values()].reduce((a, b) => a + b, 0),
    })
  }
  return NextResponse.json({ worlds: result })
}
