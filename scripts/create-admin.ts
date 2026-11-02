// Create an admin account for testing the admin panel.
// Run with: bun run scripts/create-admin.ts
import { db } from '../src/lib/db'
import { hashPassword } from '../src/lib/crypto'

async function main() {
  const admin = await db.user.upsert({
    where: { nickname: 'admin' },
    update: {},
    create: {
      nickname: 'admin',
      passwordHash: hashPassword('admin123'),
      role: 'admin',
      ageBand: '14-16',
    },
  })
  console.log('Admin account ready:', admin.nickname, '(password: admin123)')
}
main().catch(console.error).finally(() => process.exit(0))
