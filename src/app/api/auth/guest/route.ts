// POST /api/auth/guest
// Creates or reuses a guest account identified by a localStorage id.
// Body: { guestId: string, ageBand?: AgeBand }
// Returns: { user, guestId }
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { createSession, setSessionCookie, toPublicUser } from '@/lib/auth'

const Schema = z.object({
  guestId: z.string().optional(),
  ageBand: z.enum(['8-10', '11-13', '14-16']).optional(),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }
  const { guestId, ageBand } = parsed.data

  let user
  if (guestId) {
    user = await db.user.findUnique({ where: { id: guestId } })
    if (user && user.role !== 'guest') {
      // Already claimed — refuse; client should treat as not-a-guest.
      return NextResponse.json({ error: 'NOT_GUEST' }, { status: 403 })
    }
  }
  if (!user) {
    const id = guestId || undefined
    user = await db.user.create({
      data: {
        id,
        nickname: `Guest-${randomBytes(3).toString('hex')}`,
        role: 'guest',
        ageBand: ageBand ?? '8-10',
      },
    })
    await db.streak.createMany({ data: [
      { userId: user.id, type: 'login' },
      { userId: user.id, type: 'study' },
    ]})
  }

  const token = await createSession(user.id)
  await setSessionCookie(token)
  return NextResponse.json({ user: toPublicUser(user), guestId: user.id })
}
