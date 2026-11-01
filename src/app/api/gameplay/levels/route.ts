// GET /api/gameplay/levels?worldId=... — list levels for a world with the
// current user's best stars + unlock state.
// Unlock logic: level 1 always unlocked; level N unlocked if best score on
// level N-1 >= that level's unlockThreshold.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { LevelInfo } from '@/types'

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const url = new URL(req.url)
  const worldId = url.searchParams.get('worldId')
  if (!worldId) return NextResponse.json({ error: 'MISSING_WORLD' }, { status: 400 })

  const levels = await db.level.findMany({
    where: { worldId },
    orderBy: { levelNumber: 'asc' },
  })
  if (levels.length === 0) return NextResponse.json({ levels: [] })

  const bestResults = await db.roundResult.findMany({
    where: { userId: user.id, levelId: { in: levels.map(l => l.id) } },
    select: { levelId: true, stars: true, score: true },
  })
  const bestByLevel = new Map<string, { stars: number; percent: number }>()
  for (const r of bestResults) {
    const cur = bestByLevel.get(r.levelId)
    if (!cur || r.stars > cur.stars) {
      bestByLevel.set(r.levelId, { stars: r.stars, percent: r.score })
    }
  }

  const out: LevelInfo[] = levels.map((l, idx) => {
    const best = bestByLevel.get(l.id)
    let unlocked = idx === 0
    if (!unlocked && idx > 0) {
      const prev = levels[idx - 1]
      const prevBest = bestByLevel.get(prev.id)
      unlocked = !!(prevBest && prevBest.percent >= prev.unlockThreshold)
    }
    return {
      id: l.id,
      worldId: l.worldId,
      levelNumber: l.levelNumber,
      difficulty: l.difficulty,
      title: l.title,
      isBoss: l.isBoss,
      questionCount: l.questionCount,
      unlockThreshold: l.unlockThreshold,
      bestStars: best?.stars,
      bestPercent: best?.percent,
      unlocked,
    }
  })

  return NextResponse.json({ levels: out })
}
