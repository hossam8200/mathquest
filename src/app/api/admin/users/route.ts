// GET /api/admin/users — list all users with summary stats.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

export async function GET() {
  try {
    await requireRole('admin')
  } catch {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }
  const users = await db.user.findMany({
    where: { role: { not: 'guest' } },
    select: {
      id: true, nickname: true, role: true, ageBand: true, coins: true,
      createdAt: true, loginStreak: true, longestLoginStreak: true,
      _count: { select: { roundResults: true, purchases: true, badges: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ users })
}
