// POST /api/parent/verify-pin — verify the parent PIN.
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { verifyPin } from '@/lib/crypto'

const Schema = z.object({ pin: z.string().regex(/^\d{4}$/) })

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  if (!user.parentPin) return NextResponse.json({ error: 'NO_PIN_SET' }, { status: 400 })

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const ok = verifyPin(parsed.data.pin, user.parentPin)
  if (!ok) return NextResponse.json({ error: 'WRONG_PIN' }, { status: 401 })
  return NextResponse.json({ ok: true })
}
