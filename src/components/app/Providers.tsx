'use client'

// Wraps the app with: QueryClient, settings (theme/dark/RTL/text-scale), and toast hydration.
// Reads settings from the Zustand persisted store and applies the html attributes.

import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { useSettingsStore } from '@/store/settings-store'
import { setMuted } from '@/lib/sounds'

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
      },
    })
  )

  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const darkMode = useSettingsStore((s) => s.darkMode)
  const lang = useSettingsStore((s) => s.lang)
  const textScale = useSettingsStore((s) => s.textScale)

  // Apply theme + RTL + text scale to <html>
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', darkMode)
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
    root.setAttribute('lang', lang)
    root.setAttribute('data-text-scale', textScale)
  }, [darkMode, lang, textScale])

  // Sync mute state
  useEffect(() => {
    setMuted(!soundEnabled)
  }, [soundEnabled])

  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}
