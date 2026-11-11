// GET /api/auth/check-nickname?nickname=<name>
// Returns { available: boolean } — used by the signup form for live availability feedback.
// On DB errors, returns { available: true, reason: 'unknown' } so the user isn't blocked
// (the final check happens again at /api/auth/signup).
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const nickname = (searchParams.get('nickname') || '').trim()

  if (!nickname || nickname.length < 2 || nickname.length > 20) {
    return NextResponse.json({ available: false, reason: 'invalid' })
  }

  try {
    const existing = await db.user.findFirst({
      where: { nickname: { equals: nickname, mode: 'insensitive' }, role: { not: 'guest' } },
      select: { id: true },
    })
    return NextResponse.json({ available: !existing })
  } catch {
    // Don't block signup on transient DB issues — the signup endpoint
    // itself does a final uniqueness check before inserting.
    return NextResponse.json({ available: true, reason: 'unchecked' })
  }
}
