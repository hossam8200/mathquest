// Math question generation per age band & difficulty.
// Pure functions, shared between server (level play, validation) and client (preview).

export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed'
export type AgeBand = '8-10' | '11-13' | '14-16'

export const OP_SYMBOLS: Record<Exclude<Operation, 'mixed'>, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
}

export interface Question {
  operation: Exclude<Operation, 'mixed'>
  symbol: string
  a: number
  b: number
  answer: number
  prompt: string
  // For multiple choice — 4 options including the correct one.
  options: number[]
  hint?: string
  explanation?: string
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Produce N unique distractors around the correct answer.
function distractors(correct: number, n: number): number[] {
  const set = new Set<number>()
  let guard = 0
  while (set.size < n && guard < 50) {
    guard++
    const delta = pick([-10, -5, -2, -1, 1, 2, 5, 10, -1, 1])
    const cand = correct + delta
    if (cand !== correct && cand >= -999 && cand <= 9999) set.add(cand)
  }
  return [...set]
}

function buildOptions(answer: number): number[] {
  const opts = new Set<number>([answer])
  for (const d of distractors(answer, 5)) {
    if (opts.size >= 4) break
    opts.add(d)
  }
  // Shuffle
  return [...opts].sort(() => Math.random() - 0.5)
}

function make(
  operation: Exclude<Operation, 'mixed'>,
  a: number,
  b: number,
  hint?: string,
  explanation?: string
): Question {
  let answer = 0
  switch (operation) {
    case 'addition': answer = a + b; break
    case 'subtraction': answer = a - b; break
    case 'multiplication': answer = a * b; break
    case 'division': answer = a / b; break
  }
  return {
    operation,
    symbol: OP_SYMBOLS[operation],
    a, b,
    answer,
    prompt: `${a} ${OP_SYMBOLS[operation]} ${b}`,
    options: buildOptions(answer),
    hint,
    explanation,
  }
}

// Difficulty 1..10. Higher = bigger numbers / harder cases.
export function generateQuestion(
  operation: Operation,
  ageBand: AgeBand,
  difficulty: number
): Question {
  // Resolve mixed → random pick from the 4 operations, but keep age-appropriate.
  let op: Exclude<Operation, 'mixed'>
  if (operation === 'mixed') {
    op = pick(['addition', 'subtraction', 'multiplication', 'division'])
  } else {
    op = operation
  }

  const d = Math.max(1, Math.min(10, difficulty))

  if (ageBand === '8-10') {
    // Single/double digits, no negatives, division with whole answers.
    if (op === 'addition') {
      const a = randInt(1 + d, 9 + d * 6)
      const b = randInt(1 + d, 9 + d * 6)
      return make(op, a, b, 'Count up to find the total.', 'Add the two numbers together.')
    }
    if (op === 'subtraction') {
      const a = randInt(5 + d, 20 + d * 6)
      const b = randInt(1, a - 1) // guarantee non-negative
      return make(op, a, b, 'Start with the bigger number and take away.', 'Subtract the smaller from the bigger.')
    }
    if (op === 'multiplication') {
      const max = Math.min(12, 5 + d)
      const a = randInt(2, max)
      const b = randInt(2, max)
      return make(op, a, b, 'Think of it as repeated addition.', `${a} added to itself ${b} times.`)
    }
    // division — whole answers only
    const b = randInt(2, Math.min(10, 3 + Math.floor(d / 2)))
    const ans = randInt(2, 10)
    const a = b * ans
    return make(op, a, b, 'How many groups fit inside?', `${a} split into groups of ${b} = ${ans}.`)
  }

  if (ageBand === '11-13') {
    // Up to 3 digits, times tables to 15, simple remainders.
    if (op === 'addition') {
      const a = randInt(10, 50 + d * 80)
      const b = randInt(10, 50 + d * 80)
      return make(op, a, b)
    }
    if (op === 'subtraction') {
      const a = randInt(50, 100 + d * 100)
      const b = randInt(10, a - 1)
      return make(op, a, b)
    }
    if (op === 'multiplication') {
      if (d <= 4) {
        const a = randInt(6, 15)
        const b = randInt(6, 15)
        return make(op, a, b, undefined, `Times table fact: ${a} × ${b}.`)
      }
      const a = randInt(11, 25 + d * 5)
      const b = randInt(2, 12)
      return make(op, a, b)
    }
    // division — most whole, some with simple remainders (rounded answer)
    if (d <= 5) {
      const b = randInt(2, 12)
      const ans = randInt(3, 15)
      const a = b * ans
      return make(op, a, b)
    }
    // Harder: present as quotient with whole part (rounded to nearest int)
    const a = randInt(100, 500 + d * 50)
    const b = randInt(3, 12)
    const answer = Math.round(a / b)
    // Rebuild with a divisible by b at the answer, so the answer is exact.
    const aFixed = answer * b
    return make(op, aFixed, b)
  }

  // 14-16: larger, negatives, multi-step, decimals.
  if (op === 'addition') {
    if (d >= 6) {
      const a = pick([randInt(-200, 200), randInt(100, 999)])
      const b = pick([randInt(-200, 200), randInt(100, 999)])
      return make(op, a, b)
    }
    const a = randInt(50, 500 + d * 80)
    const b = randInt(50, 500 + d * 80)
    return make(op, a, b)
  }
  if (op === 'subtraction') {
    const a = randInt(100, 999)
    const b = randInt(-100, a - 10)
    return make(op, a, b)
  }
  if (op === 'multiplication') {
    if (d <= 4) {
      const a = randInt(12, 25)
      const b = randInt(2, 15)
      return make(op, a, b)
    }
    // decimals
    const a = randInt(5, 30)
    const bDec = randInt(2, 9) / 10
    const answer = Math.round(a * bDec * 100) / 100
    // Rebuild a × b = exact
    return {
      operation: op,
      symbol: OP_SYMBOLS[op],
      a,
      b: bDec,
      answer,
      prompt: `${a} × ${bDec}`,
      options: buildOptions(Math.round(answer * 100) / 100),
      hint: 'Move the decimal point.',
      explanation: `${a} × ${bDec} = ${answer}.`,
    }
  }
  // division — decimals allowed
  if (d <= 5) {
    const b = randInt(2, 15)
    const ans = randInt(5, 30)
    const a = b * ans
    return make(op, a, b)
  }
  const b = randInt(3, 20)
  const a = randInt(100, 999)
  const answer = Math.round((a / b) * 100) / 100
  return {
    operation: op,
    symbol: OP_SYMBOLS[op],
    a, b,
    answer,
    prompt: `${a} ÷ ${b}`,
    options: buildOptions(answer),
    hint: 'Round to 2 decimals.',
    explanation: `${a} ÷ ${b} ≈ ${answer}.`,
  }
}

// Generate 10 questions for a level. Server uses this to author rounds;
// the SAME function is used to validate submitted answers.
export function generateRound(
  operation: Operation,
  ageBand: AgeBand,
  difficulty: number,
  count = 10
): Question[] {
  const out: Question[] = []
  for (let i = 0; i < count; i++) {
    out.push(generateQuestion(operation, ageBand, difficulty))
  }
  return out
}

// Validate a user's answer against the stored Question (server-side).
export function checkAnswer(q: Question, userAnswer: string | number | null | undefined): boolean {
  if (userAnswer === null || userAnswer === undefined) return false
  const ua = typeof userAnswer === 'number' ? String(userAnswer) : userAnswer.trim()
  // Compare numerically to tolerate "05" vs "5", "2.5" vs "2.50", negatives.
  const u = Number(ua)
  if (Number.isNaN(u)) return false
  return Math.abs(u - q.answer) < 1e-6
}
