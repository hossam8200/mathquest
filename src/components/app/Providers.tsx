'use client'

// Wraps the app with: QueryClient, settings (theme/dark/RTL/text-scale), toast hydration,
// and a global image error handler that falls back to inline SVG avatars when DiceBear API
// is unavailable (offline PWA mode, API down, network issues).

import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { useSettingsStore } from '@/store/settings-store'
import { setMuted } from '@/lib/sounds'
import { fallbackAvatar } from '@/lib/dicebear'

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

  // Global DiceBear fallback: if any avatar image fails to load,
  // swap it to an inline SVG data URI (always works, even offline).
  useEffect(() => {
    const handleImgError = (e: Event) => {
      const img = e.target as HTMLImageElement
      // Only handle DiceBear URLs that haven't already been fallbacked
      if (img.src && img.src.includes('api.dicebear.com') && !img.dataset.fallbackApplied) {
        img.dataset.fallbackApplied = 'true'
        // Extract seed and size from the URL
        const seedMatch = img.src.match(/seed=([^&]*)/)
        const sizeMatch = img.src.match(/size=(\d+)/)
        const seed = seedMatch ? decodeURIComponent(seedMatch[1]) : 'MathQuest'
        const size = sizeMatch ? parseInt(sizeMatch[1]) : 80
        // Generate inline SVG fallback
        img.src = fallbackAvatar(seed, size)
      }
    }
    // Use capture phase to catch img error events
    document.addEventListener('error', handleImgError, true)
    return () => document.removeEventListener('error', handleImgError, true)
  }, [])

  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}
