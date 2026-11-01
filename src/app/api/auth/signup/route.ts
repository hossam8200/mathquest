// POST /api/auth/signup
// Body: { nickname, password, ageBand, parentEmail?, parentPin? }
// Creates a child account, sets a session cookie, returns public user.
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword, hashPin } from '@/lib/crypto'
import { createSession, setSessionCookie, toPublicUser } from '@/lib/auth'

const Schema = z.object({
  nickname: z.string().min(2).max(20),
  password: z.string().min(4).max(64),
  ageBand: z.enum(['8-10', '11-13', '14-16']),
  parentEmail: z.string().email().optional().nullable(),
  parentPin: z.string().regex(/^\d{4}$/).optional().nullable(),
  migrateGuestId: z.string().optional(),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT', details: parsed.error.flatten() }, { status: 400 })
  }
  const { nickname, password, ageBand, parentEmail, parentPin, migrateGuestId } = parsed.data

  const existing = await db.user.findUnique({ where: { nickname } })
  if (existing && existing.role !== 'guest') {
    return NextResponse.json({ error: 'NICKNAME_TAKEN' }, { status: 409 })
  }

  let user
  if (migrateGuestId && existing?.id === migrateGuestId && existing.role === 'guest') {
    // Claim guest row
    user = await db.user.update({
      where: { id: migrateGuestId },
      data: {
        nickname,
        passwordHash: hashPassword(password),
        role: 'child',
        ageBand,
        parentEmail: parentEmail ?? null,
        parentPin: parentPin ? hashPin(parentPin) : null,
      },
    })
  } else {
    user = await db.user.create({
      data: {
        nickname,
        passwordHash: hashPassword(password),
        role: 'child',
        ageBand,
        parentEmail: parentEmail ?? null,
        parentPin: parentPin ? hashPin(parentPin) : null,
      },
    })
    // Seed streak rows
    await db.streak.createMany({ data: [
      { userId: user.id, type: 'login' },
      { userId: user.id, type: 'study' },
    ]})
  }

  const token = await createSession(user.id)
  await setSessionCookie(token)
  return NextResponse.json({ user: toPublicUser(user) })
}
