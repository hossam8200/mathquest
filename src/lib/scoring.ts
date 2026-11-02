// Scoring engine: points, stars, coins, bonuses.
// Used on the server after a round is submitted & re-validated.

export interface RoundInput {
  correctCount: number
  totalCount: number
  durationMs: number
  bestStreak: number
}

export interface RoundScore {
  percent: number       // 0..100 accuracy
  stars: number         // 0..3
  pointsEarned: number
  coinsEarned: number
  passed: boolean
}

// Per-question base points: 10 for correct.
// Speed bonus: up to +5 if answered in <3s, scaled down to 0 by 10s.
// Streak bonus: +2 per consecutive correct after the first 2.
// Perfect-round bonus: +25 if all correct.
// Coins: 1 coin per 10 points, rounded down. Min 1 coin if passed.
export function scoreRound(input: RoundInput): RoundScore {
  const { correctCount, totalCount, durationMs, bestStreak } = input
  const percent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
  const passed = percent >= 70

  const basePoints = correctCount * 10

  // Average time per question
  const avgSec = totalCount > 0 ? durationMs / 1000 / totalCount : 0
  let speedBonus = 0
  if (avgSec <= 3) speedBonus = 5 * totalCount
  else if (avgSec <= 10) speedBonus = Math.round((10 - avgSec) / 7 * 5 * totalCount)
  speedBonus = Math.max(0, speedBonus)

  const streakBonus = Math.max(0, bestStreak - 1) * 2
  const perfectBonus = correctCount === totalCount ? 25 : 0

  const pointsEarned = basePoints + speedBonus + streakBonus + perfectBonus
  const coinsEarned = Math.max(passed ? 1 : 0, Math.floor(pointsEarned / 10))

  // Stars: 1 = pass (>=70%), 2 = >=85%, 3 = 100%
  let stars = 0
  if (percent >= 70) stars = 1
  if (percent >= 85) stars = 2
  if (percent === 100) stars = 3

  return { percent, stars, pointsEarned, coinsEarned, passed }
}

// Per-question speed bonus (returned to client for live display).
export function questionSpeedBonus(timeMs: number): number {
  const sec = timeMs / 1000
  if (sec <= 3) return 5
  if (sec <= 10) return Math.round((10 - sec) / 7 * 5)
  return 0
}

// Flashcard review rewards — small but motivating.
export function reviewReward(correct: boolean): { points: number; coins: number } {
  if (correct) return { points: 2, coins: 0 }
  return { points: 0, coins: 0 }
}

// Match game scoring.
export function matchScore(timeSec: number, mistakes: number, pairs: number): { score: number; points: number; coins: number } {
  const base = pairs * 20
  const timePenalty = Math.min(base / 2, timeSec * 2)
  const mistakePenalty = mistakes * 10
  const score = Math.max(0, Math.round(base - timePenalty - mistakePenalty))
  return {
    score,
    points: score,
    coins: Math.floor(score / 20),
  }
}

// Daily login bonus: grows with streak, capped.
export function dailyLoginBonus(streak: number): number {
  return Math.min(50, 10 + Math.min(streak, 7) * 5)
}
