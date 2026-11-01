// Shared TypeScript types used across client + server.

import type { Operation, AgeBand, Question } from '@/lib/math-engine'
import type { CardStatus } from '@/lib/spaced-repetition'

export type { Operation, AgeBand, Question, CardStatus }

export type ViewKey =
  | 'home'
  | 'worlds'
  | 'gameplay'
  | 'marketplace'
  | 'collection'
  | 'decks'
  | 'flashcard-learn'
  | 'match-game'
  | 'progress'
  | 'leaderboard'
  | 'daily'
  | 'parent'
  | 'admin'
  | 'settings'

export interface PublicUser {
  id: string
  nickname: string
  role: 'child' | 'parent' | 'admin'
  ageBand: AgeBand | null
  parentEmail: string | null
  avatarCharacterId: string | null
  coins: number
  soundEnabled: boolean
  darkMode: boolean
  language: 'en' | 'ar'
  textScale: 'sm' | 'md' | 'lg'
  dailyTimeLimitMins: number
  dailyCardGoal: number
  lastLoginDate: string | null
  loginStreak: number
  longestLoginStreak: number
  createdAt: string
}

export interface WorldInfo {
  id: string
  key: Operation
  name: string
  emoji: string
  sortOrder: number
}

export interface LevelInfo {
  id: string
  worldId: string
  levelNumber: number
  difficulty: number
  title: string
  isBoss: boolean
  questionCount: number
  unlockThreshold: number
  bestStars?: number
  bestPercent?: number
  unlocked: boolean
}

export interface CharacterInfo {
  id: string
  key: string
  name: string
  description: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  price: number
  artKind: 'svg' | 'emoji'
  artPayload: string
  perkType: 'hint' | 'time' | 'none' | null
  perkValue: number | null
  enabled: boolean
  owned: boolean
  equipped: boolean
}

export interface DeckInfo {
  id: string
  title: string
  description: string
  coverIcon: string
  operation: Operation
  ageBand: AgeBand
  isBuiltIn: boolean
  isCustom: boolean
  cardCount: number
  masteryPct?: number
  counts?: Record<CardStatus, number>
  bestMatchTimeSec?: number | null
  assignedByParent?: boolean
}

export interface CardInfo {
  id: string
  deckId: string
  front: string
  back: string
  hint: string | null
  explanation: string | null
  sortOrder: number
  status?: CardStatus
}

export interface BadgeInfo {
  id: string
  key: string
  name: string
  description: string
  emoji: string
  coinReward: number
  earned: boolean
  earnedAt?: string | null
}

export interface ProgressStats {
  totalPoints: number
  totalCoins: number
  accuracyByOp: Record<string, number>
  bestStreak: number
  levelsCompleted: number
  cardsMastered: number
  studyStreak: number
  longestStudyStreak: number
  pointsOverTime: { date: string; points: number }[]
  cardsMasteredOverTime: { date: string; count: number }[]
}

export interface LeaderboardRow {
  nickname: string
  avatarCharacterId: string | null
  totalPoints: number
  isCurrentUser: boolean
  rank: number
}
