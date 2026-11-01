// Simplified SM-2 + Leitner-style spaced repetition.
// Pure functions. The CardProgress row in the DB holds the state.

export type Rating = 'again' | 'hard' | 'good' | 'easy'
// Equivalent to Anki-style ratings for self-assessed reviews.
// 'again' = Not yet, 'hard' = Almost, 'good' = Got it (after struggle), 'easy' = Got it (instant)

export type CardStatus = 'new' | 'learning' | 'reviewing' | 'mastered'

export interface SRState {
  status: CardStatus
  ease: number
  interval: number // days
  correctStreak: number
  totalReviews: number
  correctReviews: number
  lastReviewed: Date | null
  nextReview: Date
}

export interface SRInput extends SRState {
  rating: Rating
  wasCorrect: boolean
}

export interface SROutput {
  status: CardStatus
  ease: number
  interval: number
  correctStreak: number
  totalReviews: number
  correctReviews: number
  lastReviewed: Date
  nextReview: Date
}

const DAY_MS = 24 * 60 * 60 * 1000

function clampEase(e: number): number {
  return Math.max(1.3, Math.min(3.0, e))
}

// Mastered after 3 consecutive correct reviews AND interval >= 21 days.
const MASTERY_STREAK = 3
const MASTERY_INTERVAL = 21

export function applyReview(input: SRInput): SROutput {
  const now = new Date()
  const wasCorrect = input.wasCorrect
  let ease = input.ease
  let interval = input.interval
  let streak = wasCorrect ? input.correctStreak + 1 : 0
  let status: CardStatus = input.status

  // Ease adjustments (Anki-style, simplified)
  if (wasCorrect) {
    if (input.rating === 'easy') ease = clampEase(ease + 0.15)
    else if (input.rating === 'good') ease = clampEase(ease + 0)
    else if (input.rating === 'hard') ease = clampEase(ease - 0.15)
  } else {
    ease = clampEase(ease - 0.2)
  }

  if (!wasCorrect) {
    // Lapse — back to learning, short interval.
    status = 'learning'
    interval = 0 // re-show same session
  } else {
    if (input.status === 'new' || input.status === 'learning') {
      // First learn → 1 day
      interval = 1
      status = 'reviewing'
    } else {
      // Reviewing — grow interval by ease, plus rating nudge
      const factor =
        input.rating === 'easy' ? ease * 1.3 :
        input.rating === 'good' ? ease :
        input.rating === 'hard' ? ease * 0.8 :
        ease
      const newInterval = Math.max(1, Math.round((interval || 1) * factor))
      interval = newInterval
    }

    if (streak >= MASTERY_STREAK && interval >= MASTERY_INTERVAL) {
      status = 'mastered'
    } else if (status !== 'mastered') {
      status = 'reviewing'
    }
  }

  const nextReview = new Date(now.getTime() + Math.max(0, interval) * DAY_MS)

  return {
    status,
    ease,
    interval,
    correctStreak: streak,
    totalReviews: input.totalReviews + 1,
    correctReviews: input.correctReviews + (wasCorrect ? 1 : 0),
    lastReviewed: now,
    nextReview,
  }
}

// Pick the next N due cards (nextReview <= now). Order: most overdue first.
// Returns sorted card ids.
export function pickDueCards(progress: { cardId: string; nextReview: Date }[], limit: number): string[] {
  const now = Date.now()
  return [...progress]
    .filter(p => p.nextReview.getTime() <= now)
    .sort((a, b) => a.nextReview.getTime() - b.nextReview.getTime())
    .slice(0, limit)
    .map(p => p.cardId)
}

// New cards are introduced alongside due cards in Learn mode (mix ratio).
export function mixNewAndDue(newCardIds: string[], dueCardIds: string[], newPerSession = 5): string[] {
  const newOnes = newCardIds.slice(0, newPerSession)
  return [...newOnes, ...dueCardIds]
}

// Default initial state for a brand-new card progress row.
export function initialSRState(): SRState {
  return {
    status: 'new',
    ease: 2.5,
    interval: 0,
    correctStreak: 0,
    totalReviews: 0,
    correctReviews: 0,
    lastReviewed: null,
    nextReview: new Date(),
  }
}
