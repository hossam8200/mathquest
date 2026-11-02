import { db } from '../src/lib/db'
import { hashPin } from '../src/lib/crypto'
async function main() {
  await db.user.update({
    where: { nickname: 'TestKid' },
    data: { parentPin: hashPin('1234') },
  })
  console.log('Set TestKid parent PIN to 1234')
}
main().catch(console.error).finally(() => process.exit(0))
