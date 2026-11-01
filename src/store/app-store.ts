'use client'

// App-wide UI state: current view, selected operation/level/deck,
// equipped avatar reactions, and a small global event bus for toasts.

import { create } from 'zustand'
import type { ViewKey, Operation, AgeBand } from '@/types'

export interface NavTarget {
  view: ViewKey
  worldKey?: Operation
  levelId?: string
  deckId?: string
}

interface AppState {
  // Navigation
  view: ViewKey
  nav: NavTarget
  go: (target: Partial<NavTarget> & { view: ViewKey }) => void

  // Gameplay setup (chosen on Home/Worlds before starting a round)
  selectedOp: Operation
  selectedLevelId: string | null
  selectedWorldKey: Operation | null

  // Decks
  selectedDeckId: string | null

  // Mascot reaction (set during gameplay; mascot reads + clears)
  mascotReaction: 'idle' | 'cheer' | 'celebrate' | 'sad' | 'thinking'
  setMascotReaction: (r: AppState['mascotReaction']) => void

  // Refresh token — bump to trigger data refetch (e.g. after purchase)
  refreshNonce: number
  bumpRefresh: () => void

  // Sidebar mobile open state
  sidebarOpen: boolean
  setSidebarOpen: (o: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  view: 'home',
  nav: { view: 'home' },
  go: (target) =>
    set({
      view: target.view,
      nav: { view: target.view, ...target },
      sidebarOpen: false,
    }),

  selectedOp: 'addition',
  selectedLevelId: null,
  selectedWorldKey: null,

  selectedDeckId: null,

  mascotReaction: 'idle',
  setMascotReaction: (r) => set({ mascotReaction: r }),

  refreshNonce: 0,
  bumpRefresh: () => set((s) => ({ refreshNonce: s.refreshNonce + 1 })),

  sidebarOpen: false,
  setSidebarOpen: (o) => set({ sidebarOpen: o }),
}))

export function useNav() {
  return useAppStore((s) => s.nav)
}
