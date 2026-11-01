'use client'

// Top-level view router. Reads the current user; if none, shows the auth screen.
// Otherwise renders the sidebar + header + the active screen.

import { useAppStore } from '@/store/app-store'
import { useSettingsStore } from '@/store/settings-store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Header } from './common/Header'
import { Sidebar } from './common/Sidebar'
import { AuthScreen } from './screens/AuthScreen'
import { HomeScreen } from './screens/HomeScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { WorldMapScreen } from './screens/WorldMapScreen'
import { GameplayScreen } from './screens/GameplayScreen'
import { ComingSoon } from './screens/ComingSoon'
import type { ViewKey } from '@/types'

export function AppShell() {
  const { user, isLoading } = useCurrentUser()
  const view = useAppStore((s) => s.view)
  const lang = useSettingsStore((s) => s.lang)

  // Apply age-band attribute so globals.css can scale buttons.
  if (typeof document !== 'undefined' && user?.ageBand) {
    document.documentElement.setAttribute('data-age-band', user.ageBand)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-6xl mq-bounce">🦊</div>
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) return <AuthScreen />

  // Hydrate settings from server profile on first load.
  // (useSettingsStore hydrateFromUser is called in HomeScreen mount to avoid SSR mismatch.)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          {renderView(view)}
        </main>
      </div>
    </div>
  )
}

function renderView(view: ViewKey): React.ReactNode {
  switch (view) {
    case 'home':         return <HomeScreen />
    case 'worlds':       return <WorldMapScreen />
    case 'gameplay':     return <GameplayScreen />
    case 'settings':     return <SettingsScreen />
    // These screens are built in later phases; show informative placeholder.
    case 'marketplace':  return <ComingSoon view="marketplace" phase="P4" />
    case 'collection':   return <ComingSoon view="collection" phase="P4" />
    case 'decks':        return <ComingSoon view="decks" phase="P5" />
    case 'flashcard-learn': return <ComingSoon view="flashcard-learn" phase="P5" />
    case 'match-game':   return <ComingSoon view="match-game" phase="P5" />
    case 'progress':     return <ComingSoon view="progress" phase="P5" />
    case 'leaderboard':  return <ComingSoon view="leaderboard" phase="P5" />
    case 'daily':        return <ComingSoon view="daily" phase="P3" />
    case 'parent':       return <ComingSoon view="parent" phase="P6" />
    case 'admin':        return <ComingSoon view="admin" phase="P6" />
    default:             return <HomeScreen />
  }
}
