// Streak helpers — server-only.
// A streak counts consecutive days (UTC) with activity.

import { db } from './db'

function midnightUTC(d = new Date()): Date {
  const x = new Date(d)
  x.setUTCHours(0, 0, 0, 0)
  return x
}

// Bump a streak for the given type. Idempotent per UTC day.
export async function bumpStreak(userId: string, type: 'login' | 'study') {
  const today = midnightUTC()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

  let streak = await db.streak.findUnique({ where: { userId_type: { userId, type } } })
  if (!streak) {
    streak = await db.streak.create({
      data: { userId, type, current: 1, longest: 1, lastDate: today },
    })
    return streak
  }

  if (streak.lastDate) {
    const last = midnightUTC(streak.lastDate)
    if (last.getTime() === today.getTime()) return streak // already bumped today
    if (streak.freezes > 0 && last.getTime() === yesterday.getTime() - 24 * 60 * 60 * 1000) {
      // Used a freeze — gap of 2 days is forgiven
      await db.streak.update({
        where: { id: streak.id },
        data: { freezes: { decrement: 1 } },
      })
    }
  }

  const last = streak.lastDate ? midnightUTC(streak.lastDate) : null
  const continued = last && last.getTime() === yesterday.getTime()
  const newCurrent = continued ? streak.current + 1 : 1

  return db.streak.update({
    where: { id: streak.id },
    data: {
      current: newCurrent,
      longest: Math.max(streak.longest, newCurrent),
      lastDate: today,
    },
  })
}
