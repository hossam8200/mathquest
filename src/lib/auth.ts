// Cookie-based session helpers. Server-only.
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { db } from './db'
import type { User } from '@prisma/client'

export const SESSION_COOKIE = 'mq_session'
const SESSION_TTL_DAYS = 30

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)
  await db.session.create({ data: { userId, token, expiresAt } })
  return token
}

export async function setSessionCookie(token: string) {
  const expires = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)
  const c = await cookies()
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires,
    path: '/',
  })
}

export async function clearSessionCookie() {
  const c = await cookies()
  c.delete(SESSION_COOKIE)
}

export async function getCurrentUser(): Promise<User | null> {
  const c = await cookies()
  const token = c.get(SESSION_COOKIE)?.value
  if (!token) return null
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  })
  if (!session) return null
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } })
    return null
  }
  return session.user
}

export async function requireUser(): Promise<User> {
  const u = await getCurrentUser()
  if (!u) throw new Error('UNAUTHORIZED')
  return u
}

export async function requireRole(role: string): Promise<User> {
  const u = await requireUser()
  if (u.role !== role) throw new Error('FORBIDDEN')
  return u
}

// Public user shape (no passwordHash/parentPin) — safe to send to client.
// Includes a boolean flag for whether a parent PIN is set (not the PIN itself).
export type PublicUser = Omit<User, 'passwordHash' | 'parentPin'> & {
  hasParentPin: boolean
}

export function toPublicUser(u: User): PublicUser {
  const { passwordHash, parentPin, ...rest } = u
  return { ...rest, hasParentPin: !!parentPin }
}
