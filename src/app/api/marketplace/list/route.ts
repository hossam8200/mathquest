// GET /api/marketplace/list — all enabled characters with owned/equipped state.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { CharacterInfo } from '@/types'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const chars = await db.character.findMany({
    where: { enabled: true },
    orderBy: [{ rarity: 'asc' }, { price: 'asc' }],
  })
  const purchases = await db.purchase.findMany({
    where: { userId: user.id },
    select: { characterId: true },
  })
  const ownedIds = new Set(purchases.map((p) => p.characterId))

  const result: CharacterInfo[] = chars.map((c) => ({
    id: c.id,
    key: c.key,
    name: c.name,
    description: c.description,
    rarity: c.rarity as CharacterInfo['rarity'],
    price: c.price,
    artKind: c.artKind as CharacterInfo['artKind'],
    artPayload: c.artPayload,
    perkType: c.perkType as CharacterInfo['perkType'],
    perkValue: c.perkValue,
    enabled: c.enabled,
    owned: ownedIds.has(c.id) || c.price === 0, // price 0 = starter, auto-owned
    equipped: user.avatarCharacterId === c.id,
  }))
  return NextResponse.json({ characters: result })
}
