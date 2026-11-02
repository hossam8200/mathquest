// POST /api/auth/login
// Body: { nickname, password }
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/crypto'
import { createSession, setSessionCookie, toPublicUser } from '@/lib/auth'
import { dailyLoginBonus } from '@/lib/scoring'

const Schema = z.object({
  nickname: z.string().min(2).max(20),
  password: z.string().min(1).max(64),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }
  const { nickname, password } = parsed.data
  const user = await db.user.findUnique({ where: { nickname } })
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 })
  }
  if (user.role === 'guest') {
    return NextResponse.json({ error: 'GUEST_CANNOT_LOGIN' }, { status: 403 })
  }
  if (user.banned) {
    return NextResponse.json({ error: 'BANNED' }, { status: 403 })
  }

  // Daily login bonus + streak
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

  let bonusCoins = 0
  if (!user.lastLoginDate || user.lastLoginDate < today) {
    const last = user.lastLoginDate ? new Date(user.lastLoginDate) : null
    const continued = last && last >= yesterday && last < today
    const newStreak = continued ? user.loginStreak + 1 : 1
    bonusCoins = dailyLoginBonus(newStreak)
    await db.user.update({
      where: { id: user.id },
      data: {
        lastLoginDate: today,
        loginStreak: newStreak,
        longestLoginStreak: Math.max(user.longestLoginStreak, newStreak),
        coins: { increment: bonusCoins },
      },
    })
    if (bonusCoins > 0) {
      await db.transaction.create({
        data: { userId: user.id, type: 'earn', amount: bonusCoins, reason: 'daily' },
      })
    }
  }

  const token = await createSession(user.id)
  await setSessionCookie(token)
  const fresh = await db.user.findUnique({ where: { id: user.id } })
  if (!fresh) return NextResponse.json({ error: 'INTERNAL' }, { status: 500 })
  return NextResponse.json({ user: toPublicUser(fresh), bonusCoins })
}
