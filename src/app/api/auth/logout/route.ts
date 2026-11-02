// POST /api/auth/logout — clears session cookie + deletes session row.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { clearSessionCookie, SESSION_COOKIE } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST() {
  const c = await cookies()
  const token = c.get(SESSION_COOKIE)?.value
  if (token) {
    await db.session.deleteMany({ where: { token } }).catch(() => {})
  }
  await clearSessionCookie()
  return NextResponse.json({ ok: true })
}
