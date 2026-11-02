// POST /api/progress/daily/claim — claim the daily challenge reward.
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { claimDailyReward } from '@/lib/daily'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const result = await claimDailyReward(user.id)
  if (!result.ok) {
    return NextResponse.json({ error: 'NOT_CLAIMABLE' }, { status: 400 })
  }
  return NextResponse.json(result)
}
