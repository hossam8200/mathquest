// Word problem generator — creates real-world math scenarios per operation + age band.

export type WordProblem = {
  id: string
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division'
  scenario: string
  question: string
  answer: number
  options: number[]
  solution: string
  emoji: string
}

const NAMES = ['Maya', 'Liam', 'Sara', 'Tom', 'Aisha', 'Noah', 'Ella', 'Omar', 'Zoe', 'Kai', 'Fatima', 'Jack', 'Layla', 'Ben', 'Yuki']
const ITEMS = [
  { sing: 'sticker', plur: 'stickers', emoji: '🎨' },
  { sing: 'cookie', plur: 'cookies', emoji: '🍪' },
  { sing: 'book', plur: 'books', emoji: '📚' },
  { sing: 'pencil', plur: 'pencils', emoji: '✏️' },
  { sing: 'marble', plur: 'marbles', emoji: '🔮' },
  { sing: 'apple', plur: 'apples', emoji: '🍎' },
  { sing: 'card', plur: 'cards', emoji: '🃏' },
  { sing: 'candy', plur: 'candies', emoji: '🍬' },
  { sing: 'balloon', plur: 'balloons', emoji: '🎈' },
  { sing: 'sticker', plur: 'stickers', emoji: '⭐' },
]
const CONTAINERS = [
  { sing: 'box', plur: 'boxes' }, { sing: 'bag', plur: 'bags' },
  { sing: 'shelf', plur: 'shelves' }, { sing: 'tray', plur: 'trays' },
]
const ACTIVITIES = ['jumping jack', 'page read', 'lap', 'song played']

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min }
function uid(): string { return Math.random().toString(36).slice(2, 10) }

function distractors(correct: number, n: number): number[] {
  const set = new Set<number>()
  let guard = 0
  while (set.size < n && guard < 50) {
    guard++
    const delta = pick([-10, -5, -2, -1, 1, 2, 5, 10])
    const cand = correct + delta
    if (cand !== correct && cand >= 0) set.add(cand)
  }
  return [...set]
}

function buildOptions(answer: number): number[] {
  const opts = new Set<number>([answer])
  for (const d of distractors(answer, 5)) {
    if (opts.size >= 4) break
    opts.add(d)
  }
  return [...opts].sort(() => Math.random() - 0.5)
}

export function generateWordProblem(operation: WordProblem['operation'], ageBand: '8-10' | '11-13' | '14-16'): WordProblem {
  const name = pick(NAMES)
  const name2 = pick(NAMES.filter(n => n !== name))
  const item = pick(ITEMS)
  const container = pick(CONTAINERS)
  const activity = pick(ACTIVITIES)

  let a: number, b: number, answer: number, scenario: string, question: string, solution: string, emoji: string

  if (ageBand === '8-10') {
    if (operation === 'addition') {
      a = randInt(5, 25); b = randInt(3, 20); answer = a + b
      emoji = item.emoji
      scenario = `${name} has ${a} ${item.plur}. ${name2} gives ${name} ${b} more ${item.plur}.`
      question = `How many ${item.plur} does ${name} have now?`
      solution = `${name} started with ${a} ${item.plur}. Then got ${b} more. So ${a} + ${b} = ${answer}.`
    } else if (operation === 'subtraction') {
      a = randInt(15, 40); b = randInt(2, a - 1); answer = a - b
      emoji = item.emoji
      scenario = `${name} had ${a} ${item.plur}. ${name} used ${b} of them for a project.`
      question = `How many ${item.plur} are left?`
      solution = `${name} had ${a}. Used ${b}. So ${a} − ${b} = ${answer}.`
    } else if (operation === 'multiplication') {
      a = randInt(2, 8); b = randInt(2, 8); answer = a * b
      emoji = '📦'
      scenario = `Each ${container.sing} holds ${a} ${item.plur}. There are ${b} ${container.plur}.`
      question = `How many ${item.plur} are there in total?`
      solution = `${b} ${container.plur} with ${a} ${item.plur} each. So ${a} × ${b} = ${answer}.`
    } else {
      b = randInt(2, 8); answer = randInt(3, 10); a = b * answer
      emoji = '🤝'
      scenario = `${a} ${item.plur} are shared equally among ${b} friends.`
      question = `How many ${item.plur} does each friend get?`
      solution = `${a} ${item.plur} ÷ ${b} friends = ${answer} each. Check: ${answer} × ${b} = ${a}.`
    }
  } else if (ageBand === '11-13') {
    if (operation === 'addition') {
      a = randInt(50, 300); b = randInt(30, 200); answer = a + b
      emoji = '💰'
      scenario = `A store sold ${a} ${item.plur} in January and ${b} in February.`
      question = `How many ${item.plur} did the store sell in total?`
      solution = `January: ${a}. February: ${b}. Total = ${a} + ${b} = ${answer}.`
    } else if (operation === 'subtraction') {
      a = randInt(100, 500); b = randInt(20, a - 10); answer = a - b
      emoji = '🏃'
      scenario = `${name} ran ${a} meters in the morning and ${b} fewer in the afternoon.`
      question = `How far did ${name} run in the afternoon?`
      solution = `Morning: ${a}m. Afternoon is ${b} less. So ${a} − ${b} = ${answer} meters.`
    } else if (operation === 'multiplication') {
      a = randInt(6, 15); b = randInt(6, 15); answer = a * b
      emoji = '🎫'
      scenario = `Each ticket costs $${a}. ${name} buys ${b} tickets for friends.`
      question = `How much does ${name} spend in total?`
      solution = `${b} tickets at $${a} each. So $${a} × ${b} = $${answer}.`
    } else {
      b = randInt(3, 12); answer = randInt(5, 20); a = b * answer
      emoji = '🍕'
      scenario = `A pizza is cut into ${a} slices and shared equally among ${b} people.`
      question = `How many slices does each person get?`
      solution = `${a} slices ÷ ${b} people = ${answer} slices each. Check: ${answer} × ${b} = ${a}.`
    }
  } else {
    // 14-16 — multi-step, money, larger numbers
    if (operation === 'addition') {
      a = randInt(200, 800); b = randInt(150, 600); answer = a + b
      emoji = '📊'
      scenario = `A company made $${a} in revenue on Saturday and $${b} on Sunday.`
      question = `What is the total weekend revenue?`
      solution = `Saturday: $${a}. Sunday: $${b}. Total = $${a} + $${b} = $${answer}.`
    } else if (operation === 'subtraction') {
      a = randInt(500, 1000); b = randInt(100, a - 50); answer = a - b
      emoji = '🏦'
      scenario = `${name}'s bank account has $${a}. After paying a bill of $${b},`
      question = `How much is left in the account?`
      solution = `Balance: $${a}. Bill: $${b}. Remaining = $${a} − $${b} = $${answer}.`
    } else if (operation === 'multiplication') {
      a = randInt(12, 25); b = randInt(8, 15); answer = a * b
      emoji = '📦'
      scenario = `A warehouse stores ${b} ${container.plur}, each containing ${a} ${item.plur}.`
      question = `How many ${item.plur} are in the warehouse?`
      solution = `${b} ${container.plur} × ${a} ${item.plur} each = ${a} × ${b} = ${answer} ${item.plur}.`
    } else {
      b = randInt(5, 15); answer = randInt(10, 30); a = b * answer
      emoji = '✈️'
      scenario = `${a} passengers need to be divided equally onto ${b} flights.`
      question = `How many passengers per flight?`
      solution = `${a} passengers ÷ ${b} flights = ${answer} per flight. Check: ${answer} × ${b} = ${a}.`
    }
  }

  return {
    id: uid(),
    operation,
    scenario,
    question,
    answer,
    options: buildOptions(answer),
    solution,
    emoji,
  }
}

export function generateWordProblemSet(operation: WordProblem['operation'] | 'mixed', ageBand: '8-10' | '11-13' | '14-16', count = 5): WordProblem[] {
  const problems: WordProblem[] = []
  for (let i = 0; i < count; i++) {
    const op = operation === 'mixed' ? pick(['addition', 'subtraction', 'multiplication', 'division']) as WordProblem['operation'] : operation
    problems.push(generateWordProblem(op, ageBand))
  }
  return problems
}
