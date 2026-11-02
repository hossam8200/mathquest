import { db } from '../src/lib/db'
async function main() {
  const users = await db.user.findMany({ select: { id: true, nickname: true, role: true, ageBand: true, coins: true, loginStreak: true, lastLoginDate: true } })
  console.log('users:', JSON.stringify(users, null, 2))
  const sessions = await db.session.findMany({ select: { id: true, userId: true, expiresAt: true } })
  console.log('sessions:', sessions.length)
  const streaks = await db.streak.findMany()
  console.log('streaks:', streaks.length)
}
main().catch(console.error).finally(() => process.exit(0))
