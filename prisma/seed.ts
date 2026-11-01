// MathQuest seed script.
// Run with: bun run prisma/seed.ts
//
// Seeds:
//   - 5 worlds (Addition Island, Subtraction Jungle, Multiplication Mountain,
//     Division Desert, Mixed Galaxy)
//   - 30 levels per world (150 total). Level 30 of each is a boss (15 questions).
//   - 20+ starter characters across 4 rarity tiers (Phase 4 will consume these).
//   - 6 milestone badges.
//
// Idempotent: re-running upserts existing rows.

import { db } from '../src/lib/db'

const WORLDS = [
  { key: 'addition',       name: 'Addition Island',       emoji: '🏝️', sortOrder: 1 },
  { key: 'subtraction',    name: 'Subtraction Jungle',    emoji: '🌴', sortOrder: 2 },
  { key: 'multiplication', name: 'Multiplication Mountain', emoji: '⛰️', sortOrder: 3 },
  { key: 'division',       name: 'Division Desert',       emoji: '🏜️', sortOrder: 4 },
  { key: 'mixed',          name: 'Mixed Galaxy',          emoji: '🌌', sortOrder: 5 },
] as const

// Themed name generator — combines a world-specific adjective + noun.
const THEMES: Record<string, { pre: string[]; suf: string[] }> = {
  addition: {
    pre: ['Sunny', 'Coral', 'Sandy', 'Tidal', 'Wave', 'Beach', 'Lagoon', 'Tropical', 'Breezy', 'Golden'],
    suf: ['Shore', 'Splash', 'Cove', 'Reef', 'Bay', 'Haven', 'Harbor', 'Lagoon', 'Cape', 'Atoll'],
  },
  subtraction: {
    pre: ['Wild', 'Leafy', 'Vine', 'Canopy', 'Fern', 'Mossy', 'Bamboo', 'Orchid', 'Dense', 'Emerald'],
    suf: ['Trail', 'Trek', 'Tangle', 'Thicket', 'Glade', 'Grove', 'Hollow', 'Ridge', 'Path', 'Reach'],
  },
  multiplication: {
    pre: ['Peak', 'Alpine', 'Granite', 'Summit', 'Rocky', 'High', 'Stone', 'Craggy', 'Snowy', 'Crystal'],
    suf: ['Climb', 'Ascent', 'Ridge', 'Pass', 'Plateau', 'Pinnacle', 'Crest', 'Face', 'Wall', 'Tower'],
  },
  division: {
    pre: ['Dune', 'Golden', 'Desert', 'Oasis', 'Mirage', 'Cactus', 'Sunbaked', 'Arid', 'Dusty', 'Amber'],
    suf: ['Crossing', 'Drift', 'Trail', 'Expanse', 'Basin', 'Flats', 'Ridge', 'Wash', 'Mesa', 'Valley'],
  },
  mixed: {
    pre: ['Cosmic', 'Stellar', 'Nebula', 'Galactic', 'Solar', 'Lunar', 'Astral', 'Orbit', 'Comet', 'Quasar'],
    suf: ['Voyage', 'Drift', 'Belt', 'Cluster', 'Field', 'Reach', 'Path', 'Way', 'Pulse', 'Storm'],
  },
}

function levelTitle(worldKey: string, n: number, worldName: string): string {
  if (n === 30) return `Boss: ${worldName}`
  if (n % 5 === 0) return `Checkpoint ${n}`
  const t = THEMES[worldKey]
  const pre = t.pre[Math.floor((n - 1) / 3) % t.pre.length]
  const suf = t.suf[(n - 1) % t.suf.length]
  return `${pre} ${suf}`
}

// Difficulty curve: 1..10 across 30 levels.
function difficultyFor(n: number): number {
  return Math.max(1, Math.min(10, Math.ceil(n / 3)))
}

// ── Starter characters (20+) ──
// Each: key, name, description, rarity, price, artKind, artPayload (emoji or SVG),
// perkType, perkValue.
const CHARACTERS = [
  // Common — cheap, fun animal friends
  { key: 'fox',      name: 'Foxy',        description: 'A clever fox who loves puzzles.',          rarity: 'common',    price: 0,   artKind: 'emoji', artPayload: '🦊', perkType: 'none',  perkValue: null },
  { key: 'cat',      name: 'Whiskers',    description: 'A curious kitten learning to count.',     rarity: 'common',    price: 50,  artKind: 'emoji', artPayload: '🐱', perkType: 'none',  perkValue: null },
  { key: 'dog',      name: 'Biscuit',     description: 'A loyal pup who cheers you on.',          rarity: 'common',    price: 50,  artKind: 'emoji', artPayload: '🐶', perkType: 'none',  perkValue: null },
  { key: 'panda',    name: 'Bamboo',      description: 'A sleepy panda who never gives up.',      rarity: 'common',    price: 80,  artKind: 'emoji', artPayload: '🐼', perkType: 'none',  perkValue: null },
  { key: 'frog',     name: 'Hopper',      description: 'A bouncy frog with quick reflexes.',      rarity: 'common',    price: 80,  artKind: 'emoji', artPayload: '🐸', perkType: 'none',  perkValue: null },
  { key: 'penguin',  name: 'Pip',         description: 'A chilly penguin who loves patterns.',   rarity: 'common',    price: 100, artKind: 'emoji', artPayload: '🐧', perkType: 'none',  perkValue: null },
  { key: 'monkey',   name: 'Banana',      description: 'A cheeky monkey who swings through math.', rarity: 'common',  price: 100, artKind: 'emoji', artPayload: '🐵', perkType: 'none',  perkValue: null },
  { key: 'rabbit',   name: 'Cottontail',  description: 'A speedy rabbit who multiplies fast.',   rarity: 'common',    price: 120, artKind: 'emoji', artPayload: '🐰', perkType: 'none',  perkValue: null },

  // Rare — give small perks
  { key: 'robot',    name: 'Bolt',        description: 'A friendly robot that gives +5 seconds per question.', rarity: 'rare', price: 250, artKind: 'emoji', artPayload: '🤖', perkType: 'time',  perkValue: 5 },
  { key: 'owl',      name: 'Sage',        description: 'A wise owl that shows an extra hint when you need it.', rarity: 'rare', price: 250, artKind: 'emoji', artPayload: '🦉', perkType: 'hint',  perkValue: 1 },
  { key: 'unicorn',  name: 'Sparkle',     description: 'A magical unicorn that gives +5 seconds.', rarity: 'rare',    price: 300, artKind: 'emoji', artPayload: '🦄', perkType: 'time',  perkValue: 5 },
  { key: 'lion',     name: 'Brave',       description: 'A courageous lion that gives an extra hint.', rarity: 'rare', price: 300, artKind: 'emoji', artPayload: '🦁', perkType: 'hint',  perkValue: 1 },
  { key: 'dolphin',  name: 'Splash',      description: 'A clever dolphin that gives +5 seconds.', rarity: 'rare',    price: 280, artKind: 'emoji', artPayload: '🐬', perkType: 'time',  perkValue: 5 },
  { key: 'tiger',    name: 'Stripe',      description: 'A bold tiger that gives an extra hint.', rarity: 'rare',     price: 320, artKind: 'emoji', artPayload: '🐯', perkType: 'hint',  perkValue: 1 },

  // Epic
  { key: 'dragon',   name: 'Ember',       description: 'A mighty dragon that gives +10 seconds and a hint.', rarity: 'epic', price: 600, artKind: 'emoji', artPayload: '🐲', perkType: 'time',  perkValue: 10 },
  { key: 'alien',    name: 'Zyx',         description: 'A galactic explorer with +10 seconds.', rarity: 'epic',    price: 600, artKind: 'emoji', artPayload: '👽', perkType: 'time',  perkValue: 10 },
  { key: 'wizard',   name: 'Mystic',      description: 'A magical wizard with an extra hint.', rarity: 'epic',     price: 650, artKind: 'emoji', artPayload: '🧙', perkType: 'hint',  perkValue: 1 },
  { key: 'astronaut',name: 'Cosmo',       description: 'A brave astronaut with +10 seconds.', rarity: 'epic',     price: 700, artKind: 'emoji', artPayload: '🧑‍🚀', perkType: 'time', perkValue: 10 },

  // Legendary
  { key: 'phoenix',  name: 'Blaze',       description: 'A legendary phoenix that rises with +15 seconds.', rarity: 'legendary', price: 1200, artKind: 'emoji', artPayload: '🔥', perkType: 'time', perkValue: 15 },
  { key: 'galaxy',   name: 'Nova',        description: 'A cosmic being with +15 seconds and a hint.', rarity: 'legendary', price: 1500, artKind: 'emoji', artPayload: '🌠', perkType: 'time', perkValue: 15 },
  { key: 'knight',   name: 'Valor',       description: 'A legendary knight who never backs down. +15 seconds.', rarity: 'legendary', price: 1300, artKind: 'emoji', artPayload: '🛡️', perkType: 'time', perkValue: 15 },
  { key: 'genie',    name: 'Wish',        description: 'A wish-granting genie with +15 seconds and a hint.', rarity: 'legendary', price: 1600, artKind: 'emoji', artPayload: '🧞', perkType: 'time', perkValue: 15 },
] as const

const BADGES = [
  { key: 'first_level',    name: 'First Steps',       description: 'Complete your first level.',          emoji: '👟', coinReward: 20 },
  { key: 'first_boss',     name: 'Boss Slayer',       description: 'Beat your first boss level.',         emoji: '👑', coinReward: 50 },
  { key: 'perfect_round',  name: 'Flawless',          description: 'Get 100% on a level.',                emoji: '💯', coinReward: 30 },
  { key: 'streak_7',       name: 'Week Warrior',      description: '7-day study streak.',                 emoji: '🔥', coinReward: 50 },
  { key: 'streak_30',      name: 'Monthly Master',    description: '30-day study streak.',                emoji: '🌟', coinReward: 150 },
  { key: 'coins_500',      name: 'Coin Collector',    description: 'Earn 500 coins total.',               emoji: '💰', coinReward: 30 },
  { key: 'cards_100',      name: 'Card Shark',        description: 'Master 100 flashcards.',              emoji: '🃏', coinReward: 50 },
  { key: 'first_deck',     name: 'Deck Builder',      description: 'Master your first deck.',             emoji: '📚', coinReward: 40 },
  { key: 'all_worlds',     name: 'World Traveler',    description: 'Beat the boss in all 5 worlds.',      emoji: '🗺️', coinReward: 200 },
  { key: 'ten_levels',     name: 'Double Digits',     description: 'Complete 10 levels.',                 emoji: '🔟', coinReward: 40 },
] as const

async function main() {
  console.log('🌱 Seeding MathQuest…')

  // Worlds + levels
  for (const w of WORLDS) {
    const world = await db.world.upsert({
      where: { key: w.key },
      update: { name: w.name, emoji: w.emoji, sortOrder: w.sortOrder },
      create: { key: w.key, name: w.name, emoji: w.emoji, sortOrder: w.sortOrder },
    })

    for (let n = 1; n <= 30; n++) {
      const isBoss = n === 30
      const difficulty = difficultyFor(n)
      const title = levelTitle(w.key, n, w.name)
      const questionCount = isBoss ? 15 : 10
      await db.level.upsert({
        where: { worldId_levelNumber: { worldId: world.id, levelNumber: n } },
        update: { difficulty, title, isBoss, questionCount },
        create: { worldId: world.id, levelNumber: n, difficulty, title, isBoss, questionCount },
      })
    }
    console.log(`  ✓ ${w.name}: 30 levels`)
  }

  // Characters
  for (const c of CHARACTERS) {
    await db.character.upsert({
      where: { key: c.key },
      update: {
        name: c.name, description: c.description, rarity: c.rarity, price: c.price,
        artKind: c.artKind, artPayload: c.artPayload, perkType: c.perkType as string | null,
        perkValue: c.perkValue, enabled: true,
      },
      create: {
        key: c.key, name: c.name, description: c.description, rarity: c.rarity, price: c.price,
        artKind: c.artKind, artPayload: c.artPayload, perkType: c.perkType as string | null,
        perkValue: c.perkValue, enabled: true,
      },
    })
  }
  console.log(`  ✓ ${CHARACTERS.length} characters`)

  // Badges
  for (const b of BADGES) {
    await db.badge.upsert({
      where: { key: b.key },
      update: { name: b.name, description: b.description, emoji: b.emoji, coinReward: b.coinReward },
      create: { key: b.key, name: b.name, description: b.description, emoji: b.emoji, coinReward: b.coinReward },
    })
  }
  console.log(`  ✓ ${BADGES.length} badges`)

  // ── Built-in decks + cards ──
  // 15+ decks covering all 4 operations × 3 age bands + special decks.
  const BANDS = ['8-10', '11-13', '14-16'] as const
  const OPS = [
    { op: 'addition',       label: 'Addition Facts',     icon: '➕' },
    { op: 'subtraction',    label: 'Subtraction Facts',  icon: '➖' },
    { op: 'multiplication', label: 'Times Tables',       icon: '✖️' },
    { op: 'division',       label: 'Division Facts',     icon: '➗' },
  ] as const

  let deckCount = 0
  let cardCount = 0
  for (const band of BANDS) {
    for (const { op, label, icon } of OPS) {
      const title = `${label} ${band}`
      const deck = await db.deck.upsert({
        where: { id: `builtin-${op}-${band}` },
        update: { title, description: `${label} for ages ${band}`, coverIcon: icon, operation: op, ageBand: band, isBuiltIn: true, isPublic: true, ownerId: null },
        create: { id: `builtin-${op}-${band}`, title, description: `${label} for ages ${band}`, coverIcon: icon, operation: op, ageBand: band, isBuiltIn: true, isPublic: true, ownerId: null },
      })
      // Generate ~30 unique cards
      const cards = generateCardsFor(op, band, 30)
      // Wipe existing cards then recreate (idempotent)
      await db.card.deleteMany({ where: { deckId: deck.id } })
      for (let i = 0; i < cards.length; i++) {
        await db.card.create({
          data: {
            deckId: deck.id,
            front: cards[i].front,
            back: cards[i].back,
            hint: cards[i].hint ?? null,
            explanation: cards[i].explanation ?? null,
            sortOrder: i,
          },
        })
        cardCount++
      }
      deckCount++
    }
  }

  // Special decks: Mixed Operations (one per band) + Squares + Times Tables 6-9
  for (const band of BANDS) {
    const title = `Mixed Operations ${band}`
    const deck = await db.deck.upsert({
      where: { id: `builtin-mixed-${band}` },
      update: { title, description: `Mixed math for ages ${band}`, coverIcon: '🎲', operation: 'mixed', ageBand: band, isBuiltIn: true, isPublic: true, ownerId: null },
      create: { id: `builtin-mixed-${band}`, title, description: `Mixed math for ages ${band}`, coverIcon: '🎲', operation: 'mixed', ageBand: band, isBuiltIn: true, isPublic: true, ownerId: null },
    })
    const cards = generateCardsFor('mixed', band, 30)
    await db.card.deleteMany({ where: { deckId: deck.id } })
    for (let i = 0; i < cards.length; i++) {
      await db.card.create({
        data: { deckId: deck.id, front: cards[i].front, back: cards[i].back, hint: cards[i].hint ?? null, explanation: cards[i].explanation ?? null, sortOrder: i },
      })
      cardCount++
    }
    deckCount++
  }

  // Squares & Roots
  const sqDeck = await db.deck.upsert({
    where: { id: 'builtin-squares' },
    update: { title: 'Squares & Roots', description: 'Perfect squares and their roots', coverIcon: '🟦', operation: 'multiplication', ageBand: '11-13', isBuiltIn: true, isPublic: true, ownerId: null },
    create: { id: 'builtin-squares', title: 'Squares & Roots', description: 'Perfect squares and their roots', coverIcon: '🟦', operation: 'multiplication', ageBand: '11-13', isBuiltIn: true, isPublic: true, ownerId: null },
  })
  await db.card.deleteMany({ where: { deckId: sqDeck.id } })
  for (let i = 1; i <= 20; i++) {
    await db.card.create({
      data: { deckId: sqDeck.id, front: `${i}²`, back: String(i * i), hint: 'Square the number', explanation: `${i} × ${i} = ${i * i}`, sortOrder: i - 1 },
    })
    cardCount++
  }
  deckCount++

  // Times Tables 6-9 (key facts kids forget)
  const ttDeck = await db.deck.upsert({
    where: { id: 'builtin-times-6-9' },
    update: { title: 'Times Tables 6-9', description: 'Master the tricky 6-9 times tables', coverIcon: '✖️', operation: 'multiplication', ageBand: '8-10', isBuiltIn: true, isPublic: true, ownerId: null },
    create: { id: 'builtin-times-6-9', title: 'Times Tables 6-9', description: 'Master the tricky 6-9 times tables', coverIcon: '✖️', operation: 'multiplication', ageBand: '8-10', isBuiltIn: true, isPublic: true, ownerId: null },
  })
  await db.card.deleteMany({ where: { deckId: ttDeck.id } })
  let ttIdx = 0
  for (const a of [6, 7, 8, 9]) {
    for (const b of [6, 7, 8, 9, 12]) {
      await db.card.create({
        data: { deckId: ttDeck.id, front: `${a} × ${b}`, back: String(a * b), hint: undefined, explanation: undefined, sortOrder: ttIdx++ },
      })
      cardCount++
    }
  }
  deckCount++

  console.log(`  ✓ ${deckCount} built-in decks, ${cardCount} cards`)

  console.log('🌱 Seed complete!')
}

// ── Card generator ──
function generateCardsFor(op: string, band: string, count: number): { front: string; back: string; hint?: string; explanation?: string }[] {
  const cards: { front: string; back: string; hint?: string; explanation?: string }[] = []
  const seen = new Set<string>()
  const difficulty = 5
  let guard = 0
  while (cards.length < count && guard < count * 10) {
    guard++
    // Use the math-engine to generate a question
    const q = generateQuestionLocal(op, band, difficulty)
    if (seen.has(q.front)) continue
    seen.add(q.front)
    cards.push(q)
  }
  return cards
}

// Local question generator (mirrors math-engine but returns front/back format)
function generateQuestionLocal(op: string, band: string, difficulty: number): { front: string; back: string; hint?: string; explanation?: string } {
  const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
  const sym = { addition: '+', subtraction: '−', multiplication: '×', division: '÷' } as Record<string, string>

  let a: number, b: number, ans: number
  if (band === '8-10') {
    if (op === 'addition') { a = randInt(2, 20 + difficulty * 5); b = randInt(2, 20 + difficulty * 5); ans = a + b }
    else if (op === 'subtraction') { a = randInt(10, 50); b = randInt(1, a - 1); ans = a - b }
    else if (op === 'multiplication') { a = randInt(2, Math.min(12, 5 + difficulty)); b = randInt(2, Math.min(12, 5 + difficulty)); ans = a * b }
    else if (op === 'division') { b = randInt(2, 10); ans = randInt(2, 10); a = b * ans }
    else { // mixed
      const ops = ['addition', 'subtraction', 'multiplication', 'division']
      return generateQuestionLocal(pick(ops), band, difficulty)
    }
  } else if (band === '11-13') {
    if (op === 'addition') { a = randInt(10, 200); b = randInt(10, 200); ans = a + b }
    else if (op === 'subtraction') { a = randInt(50, 300); b = randInt(10, a - 1); ans = a - b }
    else if (op === 'multiplication') { a = randInt(6, 15); b = randInt(6, 15); ans = a * b }
    else if (op === 'division') { b = randInt(2, 12); ans = randInt(3, 15); a = b * ans }
    else {
      const ops = ['addition', 'subtraction', 'multiplication', 'division']
      return generateQuestionLocal(pick(ops), band, difficulty)
    }
  } else { // 14-16
    if (op === 'addition') { a = randInt(100, 999); b = randInt(100, 999); ans = a + b }
    else if (op === 'subtraction') { a = randInt(100, 999); b = randInt(100, a - 10); ans = a - b }
    else if (op === 'multiplication') { a = randInt(12, 25); b = randInt(2, 15); ans = a * b }
    else if (op === 'division') { b = randInt(3, 15); ans = randInt(5, 30); a = b * ans }
    else {
      const ops = ['addition', 'subtraction', 'multiplication', 'division']
      return generateQuestionLocal(pick(ops), band, difficulty)
    }
  }
  return {
    front: `${a} ${sym[op] ?? '+'} ${b}`,
    back: String(ans),
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
