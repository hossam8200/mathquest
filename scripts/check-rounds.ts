import { db } from '../src/lib/db'
async function main() {
  const rr = await db.roundResult.findMany({
    include: { level: true, questions: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })
  for (const r of rr) {
    console.log(`Round: ${r.percent}% (${r.correctCount}/${r.totalCount}) stars=${r.stars} points=${r.pointsEarned} coins=${r.coinsEarned} level="${r.level.title}"`)
    console.log(`  questions: ${r.questions.length}`)
  }
  const u = await db.user.findFirst({ where: { nickname: 'TestKid' }, select: { coins: true, loginStreak: true } })
  console.log('User coins:', u?.coins, 'loginStreak:', u?.loginStreak)
  const streaks = await db.streak.findMany({ include: { user: { select: { nickname: true } } } })
  for (const s of streaks) console.log(`Streak: ${s.user.nickname} ${s.type} current=${s.current} longest=${s.longest}`)
  const dp = await db.userDailyProgress.findMany({ include: { challenge: true, user: { select: { nickname: true } } } })
  for (const d of dp) console.log(`Daily: ${d.user.nickname} ${d.challenge.type} progress=${d.progress}/${d.challenge.target} completed=${d.completed} claimed=${d.claimed}`)
  const badges = await db.userBadge.findMany({ include: { badge: true, user: { select: { nickname: true } } } })
  for (const b of badges) console.log(`Badge: ${b.user.nickname} earned "${b.badge.name}"`)
}
main().catch(console.error).finally(() => process.exit(0))
