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
  { key: 'fox',      name: 'Foxy',        description: 'The Encouragement Fox! Shows uplifting messages after mistakes and gives +5 coins for trying.', rarity: 'common',    price: 0,   artKind: 'emoji', artPayload: '🦊', perkType: 'encourage',  perkValue: 5 },
  { key: 'cat',      name: 'Lucky Cat',   description: 'The Lucky Cat! Auto-corrects one wrong answer per level — "I caught that mistake for you!"', rarity: 'common',    price: 150,  artKind: 'emoji', artPayload: '🐱', perkType: 'second_chance',  perkValue: 1 },
  { key: 'dog',      name: 'Biscuit',     description: 'A loyal pup who cheers you on.',          rarity: 'common',    price: 50,  artKind: 'emoji', artPayload: '🐶', perkType: 'none',  perkValue: null },
  { key: 'panda',    name: 'Bamboo',      description: 'A sleepy panda who never gives up.',      rarity: 'common',    price: 80,  artKind: 'emoji', artPayload: '🐼', perkType: 'none',  perkValue: null },
  { key: 'frog',     name: 'Hopper',      description: 'A bouncy frog with quick reflexes.',      rarity: 'common',    price: 80,  artKind: 'emoji', artPayload: '🐸', perkType: 'none',  perkValue: null },
  { key: 'penguin',  name: 'Pip',         description: 'A chilly penguin who loves patterns.',   rarity: 'common',    price: 100, artKind: 'emoji', artPayload: '🐧', perkType: 'none',  perkValue: null },
  { key: 'monkey',   name: 'Banana',      description: 'A cheeky monkey who swings through math.', rarity: 'common',  price: 100, artKind: 'emoji', artPayload: '🐵', perkType: 'none',  perkValue: null },
  { key: 'rabbit',   name: 'Cottontail',  description: 'A speedy rabbit who multiplies fast.',   rarity: 'common',    price: 120, artKind: 'emoji', artPayload: '🐰', perkType: 'none',  perkValue: null },

  // Rare — learning-powered perks
  { key: 'owl',      name: 'Hint Owl',    description: 'The Hint Owl! Shows 3 levels of progressive hints — general tip → partial solution → full breakdown.', rarity: 'rare', price: 250, artKind: 'emoji', artPayload: '🦉', perkType: 'hint',  perkValue: 3 },
  { key: 'turtle',   name: 'Slow Turtle', description: 'The Slow Turtle! Removes the timer entirely — take all the time you need, focus on accuracy.', rarity: 'rare', price: 250, artKind: 'emoji', artPayload: '🐢', perkType: 'no_timer',  perkValue: 1 },
  { key: 'detective',name: 'Detective',   description: 'The Mistake Detective! Wrong answers become puzzles — get a clue and a second chance to fix it!', rarity: 'rare', price: 300, artKind: 'emoji', artPayload: '🕵️', perkType: 'mistake',  perkValue: 1 },
  { key: 'robot',    name: 'Bolt',        description: 'A friendly robot that gives +5 seconds per question.', rarity: 'rare', price: 250, artKind: 'emoji', artPayload: '🤖', perkType: 'time',  perkValue: 5 },
  { key: 'unicorn',  name: 'Sparkle',     description: 'A magical unicorn that gives +5 seconds.', rarity: 'rare',    price: 300, artKind: 'emoji', artPayload: '🦄', perkType: 'time',  perkValue: 5 },
  { key: 'dolphin',  name: 'Splash',      description: 'A clever dolphin that gives +5 seconds.', rarity: 'rare',    price: 280, artKind: 'emoji', artPayload: '🐬', perkType: 'time',  perkValue: 5 },
  { key: 'tiger',    name: 'Stripe',      description: 'A bold tiger that gives an extra hint.', rarity: 'rare',     price: 320, artKind: 'emoji', artPayload: '🐯', perkType: 'hint',  perkValue: 1 },

  // Epic — powerful learning perks
  { key: 'wizard',   name: 'Number Wizard',description: 'The Number Wizard! Shows visual aids for every question — arrays, groups, number lines. Perfect for visual learners!', rarity: 'epic', price: 600, artKind: 'emoji', artPayload: '🧙', perkType: 'visual',  perkValue: 1 },
  { key: 'dragon',   name: 'Ember',       description: 'A mighty dragon that gives +10 seconds and a hint.', rarity: 'epic', price: 600, artKind: 'emoji', artPayload: '🐲', perkType: 'time',  perkValue: 10 },
  { key: 'alien',    name: 'Zyx',         description: 'A galactic explorer with +10 seconds.', rarity: 'epic',    price: 600, artKind: 'emoji', artPayload: '👽', perkType: 'time',  perkValue: 10 },
  { key: 'astronaut',name: 'Cosmo',       description: 'A brave astronaut with +10 seconds.', rarity: 'epic',     price: 700, artKind: 'emoji', artPayload: '🧑‍🚀', perkType: 'time', perkValue: 10 },
  { key: 'lion',     name: 'Brave',       description: 'A courageous lion that gives an extra hint.', rarity: 'epic', price: 650, artKind: 'emoji', artPayload: '🦁', perkType: 'hint',  perkValue: 2 },

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
      const cards = generateCardsFor(op, band, 50)
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
    const cards = generateCardsFor('mixed', band, 50)
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

  // ── New special decks for expanded learning ──

  // Doubles & Near Doubles (8-10)
  const ddDeck = await db.deck.upsert({
    where: { id: 'builtin-doubles-8-10' },
    update: { title: 'Doubles & Near Doubles', description: 'Master doubles (7+7) and near doubles (7+8)', coverIcon: '🔄', operation: 'addition', ageBand: '8-10', isBuiltIn: true, isPublic: true, ownerId: null },
    create: { id: 'builtin-doubles-8-10', title: 'Doubles & Near Doubles', description: 'Master doubles (7+7) and near doubles (7+8)', coverIcon: '🔄', operation: 'addition', ageBand: '8-10', isBuiltIn: true, isPublic: true, ownerId: null },
  })
  await db.card.deleteMany({ where: { deckId: ddDeck.id } })
  let ddIdx = 0
  for (let i = 2; i <= 15; i++) {
    await db.card.create({ data: { deckId: ddDeck.id, front: `${i} + ${i}`, back: String(i * 2), hint: 'Double it!', explanation: `${i} doubled = ${i * 2}`, sortOrder: ddIdx++ } })
    cardCount++
    await db.card.create({ data: { deckId: ddDeck.id, front: `${i} + ${i + 1}`, back: String(i * 2 + 1), hint: 'Think: double then add 1', explanation: `${i}+${i}=${i*2}, +1=${i*2+1}`, sortOrder: ddIdx++ } })
    cardCount++
  }
  deckCount++

  // Number Bonds to 100 (8-10)
  const nbDeck = await db.deck.upsert({
    where: { id: 'builtin-bonds-100' },
    update: { title: 'Number Bonds to 100', description: 'Pairs that make 100', coverIcon: '💯', operation: 'addition', ageBand: '8-10', isBuiltIn: true, isPublic: true, ownerId: null },
    create: { id: 'builtin-bonds-100', title: 'Number Bonds to 100', description: 'Pairs that make 100', coverIcon: '💯', operation: 'addition', ageBand: '8-10', isBuiltIn: true, isPublic: true, ownerId: null },
  })
  await db.card.deleteMany({ where: { deckId: nbDeck.id } })
  const bonds = [10, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 5, 15, 33, 37, 42]
  for (let i = 0; i < bonds.length; i++) {
    await db.card.create({ data: { deckId: nbDeck.id, front: `${bonds[i]} + ? = 100`, back: String(100 - bonds[i]), hint: 'What adds to 100?', explanation: `${bonds[i]} + ${100 - bonds[i]} = 100`, sortOrder: i } })
    cardCount++
  }
  deckCount++

  // Percentages (14-16)
  const pctDeck = await db.deck.upsert({
    where: { id: 'builtin-percentages' },
    update: { title: 'Percentages', description: 'Convert and calculate percentages', coverIcon: '%', operation: 'division', ageBand: '14-16', isBuiltIn: true, isPublic: true, ownerId: null },
    create: { id: 'builtin-percentages', title: 'Percentages', description: 'Convert and calculate percentages', coverIcon: '%', operation: 'division', ageBand: '14-16', isBuiltIn: true, isPublic: true, ownerId: null },
  })
  await db.card.deleteMany({ where: { deckId: pctDeck.id } })
  const pctValues = [10, 20, 25, 50, 75, 15, 5, 30, 40, 60, 35, 45, 80, 90, 95, 33, 12, 8, 22, 18]
  for (let i = 0; i < pctValues.length; i++) {
    const pct = pctValues[i]
    const of200 = Math.round(200 * pct / 100)
    await db.card.create({ data: { deckId: pctDeck.id, front: `${pct}% of 200`, back: String(of200), hint: `${pct}% = ${pct}/100`, explanation: `${pct}/100 × 200 = ${of200}`, sortOrder: i } })
    cardCount++
  }
  deckCount++

  // Negative Numbers (14-16)
  const negDeck = await db.deck.upsert({
    where: { id: 'builtin-negatives' },
    update: { title: 'Negative Numbers', description: 'Add and subtract with negative numbers', coverIcon: '➖', operation: 'subtraction', ageBand: '14-16', isBuiltIn: true, isPublic: true, ownerId: null },
    create: { id: 'builtin-negatives', title: 'Negative Numbers', description: 'Add and subtract with negative numbers', coverIcon: '➖', operation: 'subtraction', ageBand: '14-16', isBuiltIn: true, isPublic: true, ownerId: null },
  })
  await db.card.deleteMany({ where: { deckId: negDeck.id } })
  const negPairs = [[5,-3],[-5,3],[-7,-8],[10,-15],[-20,5],[-12,-3],[-6,6],[8,-8],[-4,-4],[15,-20],[-9,2],[-11,-5],[3,-7],[-2,-9],[-14,6],[7,-12],[-18,3],[-1,-1],[-25,10],[-8,-7]]
  for (let i = 0; i < negPairs.length; i++) {
    const [a, b] = negPairs[i]
    await db.card.create({ data: { deckId: negDeck.id, front: `${a} + ${b}`, back: String(a + b), hint: 'Think: number line', explanation: `${a} + ${b} = ${a + b}`, sortOrder: i } })
    cardCount++
  }
  deckCount++

  // Rounding & Estimation (11-13)
  const roundDeck = await db.deck.upsert({
    where: { id: 'builtin-rounding' },
    update: { title: 'Rounding & Estimation', description: 'Round to nearest 10, 100, 1000', coverIcon: '📐', operation: 'mixed', ageBand: '11-13', isBuiltIn: true, isPublic: true, ownerId: null },
    create: { id: 'builtin-rounding', title: 'Rounding & Estimation', description: 'Round to nearest 10, 100, 1000', coverIcon: '📐', operation: 'mixed', ageBand: '11-13', isBuiltIn: true, isPublic: true, ownerId: null },
  })
  await db.card.deleteMany({ where: { deckId: roundDeck.id } })
  const roundNums = [23, 47, 82, 156, 349, 781, 1234, 5678, 89, 345, 678, 912, 4567, 234, 789, 1357, 2468, 3579, 864, 192]
  for (let i = 0; i < roundNums.length; i++) {
    const n = roundNums[i]
    const to10 = Math.round(n / 10) * 10
    const to100 = Math.round(n / 100) * 100
    await db.card.create({ data: { deckId: roundDeck.id, front: `Round ${n} to nearest 10`, back: String(to10), hint: 'Look at the ones digit', explanation: `${n} → ${to10} (nearest 10)`, sortOrder: i * 2 } })
    cardCount++
    await db.card.create({ data: { deckId: roundDeck.id, front: `Round ${n} to nearest 100`, back: String(to100), hint: 'Look at the tens digit', explanation: `${n} → ${to100} (nearest 100)`, sortOrder: i * 2 + 1 } })
    cardCount++
  }
  deckCount++

  // Times Tables 11-15 (11-13)
  const tt11Deck = await db.deck.upsert({
    where: { id: 'builtin-times-11-15' },
    update: { title: 'Times Tables 11-15', description: 'Extended times tables 11 through 15', coverIcon: '✖️', operation: 'multiplication', ageBand: '11-13', isBuiltIn: true, isPublic: true, ownerId: null },
    create: { id: 'builtin-times-11-15', title: 'Times Tables 11-15', description: 'Extended times tables 11 through 15', coverIcon: '✖️', operation: 'multiplication', ageBand: '11-13', isBuiltIn: true, isPublic: true, ownerId: null },
  })
  await db.card.deleteMany({ where: { deckId: tt11Deck.id } })
  let tt11Idx = 0
  for (const a of [11, 12, 13, 14, 15]) {
    for (const b of [2, 3, 4, 5, 6, 7, 8, 9]) {
      await db.card.create({ data: { deckId: tt11Deck.id, front: `${a} × ${b}`, back: String(a * b), hint: undefined, explanation: undefined, sortOrder: tt11Idx++ } })
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
