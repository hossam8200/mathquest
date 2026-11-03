// Step-by-Step Solver — shows the METHOD behind each operation.
// Takes an operation + two numbers, returns an array of steps.

export interface SolveStep {
  label: string
  detail: string
  highlight?: boolean
}

export interface SolveResult {
  operation: string
  symbol: string
  a: number
  b: number
  answer: number
  steps: SolveStep[]
  method: string
}

export function solveAddition(a: number, b: number): SolveResult {
  const answer = a + b
  const steps: SolveStep[] = []

  // Method: Break into place values
  steps.push({ label: 'Start', detail: `We need to find ${a} + ${b}.` })

  // Break b into parts (e.g., 28 = 20 + 8)
  const bStr = String(Math.abs(b))
  const bParts: { value: number; label: string }[] = []
  for (let i = 0; i < bStr.length; i++) {
    const digit = parseInt(bStr[i])
    const place = Math.pow(10, bStr.length - 1 - i)
    if (digit > 0) bParts.push({ value: digit * place, label: `${digit}×${place}` })
  }

  if (bParts.length > 1) {
    steps.push({ label: 'Break it down', detail: `Split ${b} into: ${bParts.map(p => String(p.value)).join(' + ')}` })
    let running = a
    for (const part of bParts) {
      running += part.value
      steps.push({
        label: `Add ${part.value}`,
        detail: `${running - part.value} + ${part.value} = ${running}`,
      })
    }
    steps.push({ label: 'Answer', detail: `${a} + ${b} = ${answer}`, highlight: true })
  } else {
    steps.push({ label: 'Add directly', detail: `${a} + ${b} = ${answer}`, highlight: true })
  }

  return { operation: 'addition', symbol: '+', a, b, answer, steps, method: 'Break-and-Add Method' }
}

export function solveSubtraction(a: number, b: number): SolveResult {
  const answer = a - b
  const steps: SolveStep[] = []

  steps.push({ label: 'Start', detail: `We need to find ${a} − ${b}.` })

  if (b <= 0) {
    steps.push({ label: 'Negative subtraction', detail: `${a} − ${b} = ${a} + ${Math.abs(b)} = ${answer}`, highlight: true })
    return { operation: 'subtraction', symbol: '−', a, b, answer, steps, method: 'Direct' }
  }

  // Count-up method: start from b, count up to a
  if (answer >= 0 && b < a) {
    // Break the difference into friendly steps
    const toNextTen = (Math.ceil(b / 10) * 10) - b
    const nextTen = Math.ceil(b / 10) * 10
    const remaining = a - nextTen

    if (toNextTen > 0 && toNextTen < 10 && remaining > 0) {
      steps.push({ label: 'Count up', detail: `Start at ${b}. Add ${toNextTen} to reach ${nextTen}.` })
      steps.push({ label: 'Keep counting', detail: `From ${nextTen}, add ${remaining} to reach ${a}.` })
      steps.push({ label: 'Total gap', detail: `${toNextTen} + ${remaining} = ${answer}`, highlight: true })
    } else {
      steps.push({ label: 'Count the gap', detail: `From ${b} to ${a} is ${answer} steps.` })
      steps.push({ label: 'Answer', detail: `${a} − ${b} = ${answer}`, highlight: true })
    }
  } else {
    // Negative result
    steps.push({ label: 'Result is negative', detail: `${b} is bigger than ${a}, so the answer is negative.` })
    steps.push({ label: 'Answer', detail: `${a} − ${b} = ${answer}`, highlight: true })
  }

  return { operation: 'subtraction', symbol: '−', a, b, answer, steps, method: 'Count-Up Method' }
}

export function solveMultiplication(a: number, b: number): SolveResult {
  const answer = a * b
  const steps: SolveStep[] = []

  steps.push({ label: 'Start', detail: `We need to find ${a} × ${b}.` })

  // Partial products method: break b into parts
  const bStr = String(Math.abs(b))
  const bParts: { value: number; label: string }[] = []
  for (let i = 0; i < bStr.length; i++) {
    const digit = parseInt(bStr[i])
    const place = Math.pow(10, bStr.length - 1 - i)
    if (digit > 0) bParts.push({ value: digit * place, label: `${digit} × ${place}` })
  }

  if (bParts.length > 1) {
    steps.push({ label: 'Break it down', detail: `Split ${b} into: ${bParts.map(p => String(p.value)).join(' + ')}` })
    const partials: number[] = []
    for (const part of bParts) {
      const product = a * part.value
      partials.push(product)
      steps.push({
        label: `Multiply by ${part.value}`,
        detail: `${a} × ${part.value} = ${product}`,
      })
    }
    steps.push({
      label: 'Add partials',
      detail: partials.join(' + ') + ` = ${answer}`,
    })
    steps.push({ label: 'Answer', detail: `${a} × ${b} = ${answer}`, highlight: true })
  } else {
    // Single digit — show as repeated addition
    if (b <= 10 && b > 0 && Number.isInteger(b)) {
      const addStr = Array(b).fill(String(a)).join(' + ')
      steps.push({ label: 'Repeated addition', detail: `${a} added ${b} times: ${addStr}` })
    }
    steps.push({ label: 'Answer', detail: `${a} × ${b} = ${answer}`, highlight: true })
  }

  return { operation: 'multiplication', symbol: '×', a, b, answer, steps, method: 'Partial Products Method' }
}

export function solveDivision(a: number, b: number): SolveResult {
  if (b === 0) {
    return {
      operation: 'division', symbol: '÷', a, b, answer: NaN,
      steps: [{ label: 'Error', detail: 'Cannot divide by zero!', highlight: true }],
      method: 'N/A',
    }
  }

  const exactAnswer = a / b
  const isExact = Number.isInteger(exactAnswer)
  const answer = isExact ? exactAnswer : Math.round(exactAnswer * 100) / 100
  const steps: SolveStep[] = []

  steps.push({ label: 'Start', detail: `We need to find ${a} ÷ ${b}.` })

  if (isExact) {
    // Show "how many groups" method
    steps.push({ label: 'Think about it', detail: `"How many groups of ${b} fit inside ${a}?"` })

    // Show repeated subtraction
    if (exactAnswer <= 10 && exactAnswer > 0) {
      let remaining = a
      let count = 0
      const subSteps: string[] = []
      while (remaining >= b && count < 10) {
        remaining -= b
        count++
        subSteps.push(`${a - (count - 1) * b} − ${b} = ${remaining}`)
      }
      if (subSteps.length <= 5) {
        for (const s of subSteps) {
          steps.push({ label: `Subtract ${b}`, detail: s })
        }
      }
      steps.push({ label: `Counted ${count} groups`, detail: `${count} groups of ${b} = ${a}` })
    }

    // Verification
    steps.push({ label: 'Check', detail: `${answer} × ${b} = ${answer * b} ✓` })
    steps.push({ label: 'Answer', detail: `${a} ÷ ${b} = ${answer}`, highlight: true })
  } else {
    steps.push({ label: 'Not exact', detail: `${a} ÷ ${b} = ${exactAnswer.toFixed(4)}...` })
    steps.push({ label: 'Rounded', detail: `≈ ${answer}`, highlight: true })
  }

  return { operation: 'division', symbol: '÷', a, b, answer, steps, method: 'Repeated Subtraction Method' }
}

export function solve(operation: string, a: number, b: number): SolveResult {
  switch (operation) {
    case 'addition': return solveAddition(a, b)
    case 'subtraction': return solveSubtraction(a, b)
    case 'multiplication': return solveMultiplication(a, b)
    case 'division': return solveDivision(a, b)
    default: return solveAddition(a, b)
  }
}
