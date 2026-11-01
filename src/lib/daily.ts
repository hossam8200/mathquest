// Daily challenge helpers — server-only.
// One global DailyChallenge per UTC day. Type rotates by day of week.

import { db } from './db'

const TYPES = ['levels', 'points', 'cards', 'match', 'levels', 'points', 'cards'] as const
const CONFIG: Record<string, { target: number; rewardCoins: number }> = {
  levels: { target: 3, rewardCoins: 30 },
  points: { target: 150, rewardCoins: 35 },
  cards:  { target: 20, rewardCoins: 30 },
  match:  { target: 2, rewardCoins: 25 },
}

function midnightUTC(d = new Date()): Date {
  const x = new Date(d)
  x.setUTCHours(0, 0, 0, 0)
  return x
}

export async function getOrCreateTodayChallenge() {
  const today = midnightUTC()
  let challenge = await db.dailyChallenge.findUnique({ where: { date: today } })
  if (!challenge) {
    const type = TYPES[today.getUTCDay()] ?? 'levels'
    const cfg = CONFIG[type]
    try {
      challenge = await db.dailyChallenge.create({
        data: { date: today, type, target: cfg.target, rewardCoins: cfg.rewardCoins },
      })
    } catch {
      // Race — another request created it
      challenge = await db.dailyChallenge.findUnique({ where: { date: today } })
      if (!challenge) throw new Error('Could not create daily challenge')
    }
  }
  return challenge
}

// Bump a user's daily progress for today's challenge (no-op if today's type doesn't match).
export async function bumpDailyProgress(userId: string, type: string, amount: number) {
  const challenge = await getOrCreateTodayChallenge()
  if (challenge.type !== type) return null
  const existing = await db.userDailyProgress.findUnique({
    where: { userId_challengeId: { userId, challengeId: challenge.id } },
  })
  if (!existing) {
    return db.userDailyProgress.create({
      data: {
        userId, challengeId: challenge.id,
        progress: Math.min(amount, challenge.target),
        completed: amount >= challenge.target,
      },
    })
  }
  if (existing.completed) return existing
  const newProgress = Math.min(existing.progress + amount, challenge.target)
  return db.userDailyProgress.update({
    where: { id: existing.id },
    data: { progress: newProgress, completed: newProgress >= challenge.target },
  })
}

// Award the daily challenge reward if completed and not yet claimed.
export async function claimDailyReward(userId: string) {
  const challenge = await getOrCreateTodayChallenge()
  const prog = await db.userDailyProgress.findUnique({
    where: { userId_challengeId: { userId, challengeId: challenge.id } },
  })
  if (!prog || !prog.completed || prog.claimed) {
    return { ok: false, rewardCoins: 0 }
  }
  await db.$transaction([
    db.userDailyProgress.update({ where: { id: prog.id }, data: { claimed: true } }),
    db.user.update({ where: { id: userId }, data: { coins: { increment: challenge.rewardCoins } } }),
    db.transaction.create({ data: { userId, type: 'earn', amount: challenge.rewardCoins, reason: 'daily' } }),
  ])
  return { ok: true, rewardCoins: challenge.rewardCoins }
}
