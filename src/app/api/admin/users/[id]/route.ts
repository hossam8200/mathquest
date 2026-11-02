// GET    /api/admin/users/[id] — full user detail with progress, purchases, badges
// PATCH  /api/admin/users/[id] — update ageBand, role, banned
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { hashPassword } from '@/lib/crypto'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireRole('admin') } catch { return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) }
  const { id } = await params

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true, nickname: true, role: true, ageBand: true, coins: true,
      banned: true, createdAt: true, lastLoginDate: true, loginStreak: true,
      longestLoginStreak: true, parentEmail: true, avatarCharacterId: true,
      language: true, darkMode: true, soundEnabled: true, textScale: true,
      dailyTimeLimitMins: true, dailyCardGoal: true,
      _count: {
        select: {
          roundResults: true, purchases: true, badges: true,
          studySessions: true, cardProgress: true, transactions: true,
        },
      },
    },
  })
  if (!user) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  // Recent activity
  const recentRounds = await db.roundResult.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, score: true, stars: true, correctCount: true, totalCount: true, pointsEarned: true, coinsEarned: true, createdAt: true, level: { select: { title: true, world: { select: { name: true, emoji: true } } } } },
  })
  const recentTransactions = await db.transaction.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
    take: 15,
    select: { id: true, type: true, amount: true, reason: true, createdAt: true },
  })
  const badges = await db.userBadge.findMany({
    where: { userId: id },
    select: { id: true, earnedAt: true, badge: true },
    orderBy: { earnedAt: 'desc' },
  })

  return NextResponse.json({ user, recentRounds, recentTransactions, badges })
}

const PatchSchema = z.object({
  ageBand: z.enum(['8-10', '11-13', '14-16']).optional(),
  role: z.enum(['child', 'parent', 'admin']).optional(),
  banned: z.boolean().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireRole('admin') } catch { return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) }
  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const user = await db.user.update({ where: { id }, data: parsed.data, select: { id: true, nickname: true, ageBand: true, role: true, banned: true } })
  return NextResponse.json({ user })
}
