import { db } from '../src/lib/db'
async function main() {
  const u = await db.user.findFirst({ where: { nickname: 'TestKid' }, select: { parentPin: true } })
  console.log('TestKid parentPin:', u?.parentPin ? 'SET' : 'NULL')
}
main().catch(console.error).finally(() => process.exit(0))
