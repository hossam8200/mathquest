'use client'

// Top app bar: shows mascot, nickname, coins, streak, sound toggle, settings, logout.
// Hidden on the auth screen (no user).

import { useAppStore } from '@/store/app-store'
import { useSettingsStore } from '@/store/settings-store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useSound } from '@/hooks/use-sound'
import { Button } from '@/components/ui/button'
import { Coins, Flame, Volume2, VolumeX, Moon, Sun, LogOut, Settings as SettingsIcon, BookOpen } from 'lucide-react'
import { t } from '@/lib/i18n'
import { kidAvatar } from '@/lib/dicebear'

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

  if (!user) return null

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur md:px-6">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden"
        aria-label="Menu"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </Button>

      <button
        onClick={() => go({ view: 'home' })}
        className="flex items-center gap-2 font-extrabold tracking-tight"
      >
        <span className="text-2xl">🦊</span>
        <span className="hidden sm:inline text-lg">{t(lang, 'appName')}</span>
      </button>

      {/* Equipped character / kid avatar — clickable, goes to Collection */}
      <button
        onClick={() => go({ view: 'collection' })}
        className="flex items-center gap-1 rounded-full transition hover:opacity-80"
        aria-label={lang === 'ar' ? 'شخصيتي' : 'My Character'}
      >
        <img
          src={kidAvatar(user.nickname, 32)}
          alt={user.nickname}
          width={32}
          height={32}
          className="rounded-full ring-2 ring-primary/30"
          loading="lazy"
        />
      </button>

      <div className="ml-auto flex items-center gap-1 md:gap-2">
        {/* Guide — visible to all logged-in users */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden sm:flex gap-1"
          aria-label={lang === 'ar' ? 'الدليل' : 'Guide'}
          onClick={() => go({ view: 'guide' })}
        >
          <BookOpen className="h-4 w-4" />
          <span className="hidden md:inline">{lang === 'ar' ? 'الدليل' : 'Guide'}</span>
        </Button>

        {/* Streak */}
        <div className="hidden sm:flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 text-sm font-bold text-amber-700 dark:text-amber-300">
          <Flame className="h-4 w-4" />
          {user.loginStreak}
        </div>

        {/* Coins */}
        <button
          onClick={() => go({ view: 'marketplace' })}
          className="flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-1 text-sm font-bold text-yellow-700 dark:text-yellow-300"
          aria-label={t(lang, 'coins')}
        >
          <Coins className="h-4 w-4" />
          {user.coins}
        </button>

        {/* Sound */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={soundEnabled ? t(lang, 'mute') : t(lang, 'unmute')}
          onClick={() => { setSound(!soundEnabled); if (soundEnabled) sfx('click') }}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>

        {/* Dark mode */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={t(lang, 'darkMode')}
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="icon" aria-label={t(lang, 'settings')} onClick={() => go({ view: 'settings' })}>
          <SettingsIcon className="h-4 w-4" />
        </Button>

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon"
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
