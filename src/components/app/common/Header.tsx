'use client'

// Top app bar: shows mascot, nickname, coins, streak, sound toggle, settings, logout.
// Hidden on the auth screen (no user).

import { useAppStore } from '@/store/app-store'
import { useSettingsStore } from '@/store/settings-store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useSound } from '@/hooks/use-sound'
import { Button } from '@/components/ui/button'
import { Coins, Flame, Volume2, VolumeX, Moon, Sun, LogOut, Settings as SettingsIcon, BookOpen } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { t } from '@/lib/i18n'
import { kidAvatar, avatarUrl, styleForRarity } from '@/lib/dicebear'
import type { CharacterInfo } from '@/types'

export function Header() {
  const { user } = useCurrentUser()
  const go = useAppStore((s) => s.go)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const lang = useSettingsStore((s) => s.lang)
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const setSound = useSettingsStore((s) => s.setSound)
  const darkMode = useSettingsStore((s) => s.darkMode)
  const setDarkMode = useSettingsStore((s) => s.setDarkMode)
  const sfx = useSound()

  // Fetch marketplace data to find equipped character (cached by React Query)
  const charsQ = useQuery<{ characters: CharacterInfo[] }>({
    queryKey: ['marketplace'],
    queryFn: async () => {
      const r = await fetch('/api/marketplace/list', { cache: 'no-store' })
      if (!r.ok) return { characters: [] }
      return r.json()
    },
    staleTime: 30_000,
  })
  const equippedChar = charsQ.data?.characters.find(c => c.equipped)
  // Use equipped character's key + rarity for avatar, fall back to nickname
  const avatarSeed = equippedChar?.key || user.nickname
  const avatarStyle = equippedChar ? styleForRarity(equippedChar.rarity) : 'adventurer' as const
  const avatarSrc = equippedChar
    ? avatarUrl(avatarSeed, avatarStyle, 32)
    : kidAvatar(user.nickname, 32)

  if (!user) return null

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b bg-background/95 px-2 backdrop-blur md:gap-2 md:px-6">
      {/* Mobile sidebar toggle — bigger, colored, with label */}
      <Button
        variant="default"
        size="icon"
        className="md:hidden shrink-0 h-11 w-11 rounded-xl"
        aria-label="Menu"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </Button>

      <button
        onClick={() => go({ view: 'home' })}
        className="flex items-center gap-1 font-extrabold tracking-tight shrink-0"
      >
        <span className="text-xl md:text-2xl">🦊</span>
        <span className="hidden sm:inline text-base md:text-lg">{t(lang, 'appName')}</span>
      </button>

      {/* Equipped character / kid avatar — clickable, goes to Collection */}
      <button
        onClick={() => go({ view: 'collection' })}
        className="flex items-center gap-1 rounded-full transition hover:opacity-80"
        aria-label={lang === 'ar' ? 'شخصيتي' : 'My Character'}
      >
        <img
          src={avatarSrc}
          alt={user.nickname}
          width={28}
          height={28}
          className="rounded-full ring-2 ring-primary/30 md:h-8 md:w-8"
          loading="lazy"
        />
      </button>

      <div className="ml-auto flex items-center gap-1 md:gap-2">
        {/* Guide — hidden on mobile (in sidebar) */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex gap-1"
          aria-label={lang === 'ar' ? 'الدليل' : 'Guide'}
          onClick={() => go({ view: 'guide' })}
        >
          <BookOpen className="h-4 w-4" />
          <span className="hidden md:inline">{lang === 'ar' ? 'الدليل' : 'Guide'}</span>
        </Button>

        {/* Streak — hidden on mobile */}
        <div className="hidden md:flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300 md:px-2.5 md:py-1 md:text-sm">
          <Flame className="h-3 w-3 md:h-4 md:w-4" />
          {user.loginStreak}
        </div>

        {/* Coins — compact on mobile */}
        <button
          onClick={() => go({ view: 'marketplace' })}
          className="flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 text-xs font-bold text-yellow-700 dark:text-yellow-300 md:px-2.5 md:py-1 md:text-sm"
          aria-label={t(lang, 'coins')}
        >
          <Coins className="h-4 w-4" />
          {user.coins}
        </button>

        {/* Sound — compact */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label={soundEnabled ? t(lang, 'mute') : t(lang, 'unmute')}
          onClick={() => { setSound(!soundEnabled); if (soundEnabled) sfx('click') }}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>

        {/* Dark mode — hidden on mobile (in sidebar) */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex shrink-0"
          aria-label={t(lang, 'darkMode')}
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Settings — hidden on mobile (in sidebar) */}
        <Button variant="ghost" size="icon" className="hidden md:inline-flex shrink-0" aria-label={t(lang, 'settings')} onClick={() => go({ view: 'settings' })}>
          <SettingsIcon className="h-4 w-4" />
        </Button>

        {/* Logout — compact */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label={t(lang, 'logout')}
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.reload()
          }}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
