// POST /api/auth/update-settings — save user preferences to the server.
// Called when the user changes language, darkMode, textScale, or sound in Settings.
// Without this, HomeScreen's hydrateFromUser() overwrites locally-changed preferences.
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, toPublicUser } from '@/lib/auth'

const Schema = z.object({
  language: z.enum(['en', 'ar']).optional(),
  darkMode: z.boolean().optional(),
  textScale: z.enum(['sm', 'md', 'lg']).optional(),
  soundEnabled: z.boolean().optional(),
})

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const data: { language?: string; darkMode?: boolean; textScale?: string; soundEnabled?: boolean } = {}
  if (parsed.data.language !== undefined) data.language = parsed.data.language
  if (parsed.data.darkMode !== undefined) data.darkMode = parsed.data.darkMode
  if (parsed.data.textScale !== undefined) data.textScale = parsed.data.textScale
  if (parsed.data.soundEnabled !== undefined) data.soundEnabled = parsed.data.soundEnabled

  const updated = await db.user.update({ where: { id: user.id }, data })
  return NextResponse.json({ user: toPublicUser(updated) })
}
