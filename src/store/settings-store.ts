'use client'

// Client-side settings that mirror the user row but are needed before
// the user is loaded (e.g. on the auth screen). After login we sync
// from the server profile.

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { setMuted } from '@/lib/sounds'

type Lang = 'en' | 'ar'
type TextScale = 'sm' | 'md' | 'lg'

interface SettingsState {
  soundEnabled: boolean
  darkMode: boolean
  lang: Lang
  textScale: TextScale
  setSound: (v: boolean) => void
  setDarkMode: (v: boolean) => void
  setLang: (l: Lang) => void
  setTextScale: (s: TextScale) => void
  hydrateFromUser: (u: { soundEnabled: boolean; darkMode: boolean; language: Lang; textScale: TextScale }) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      darkMode: false,
      lang: 'en',
      textScale: 'md',
      setSound: (v) => {
        setMuted(!v)
        set({ soundEnabled: v })
      },
      setDarkMode: (v) => set({ darkMode: v }),
      setLang: (l) => set({ lang: l }),
      setTextScale: (s) => set({ textScale: s }),
      hydrateFromUser: (u) => {
        setMuted(!u.soundEnabled)
        set({
          soundEnabled: u.soundEnabled,
          darkMode: u.darkMode,
          lang: u.language,
          textScale: u.textScale,
        })
      },
    }),
    {
      name: 'mq-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
