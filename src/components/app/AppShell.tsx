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
import { DailyChallengeScreen } from './screens/DailyChallengeScreen'
import { MarketplaceScreen } from './screens/MarketplaceScreen'
import { CollectionScreen } from './screens/CollectionScreen'
import { DecksScreen } from './screens/DecksScreen'
import { FlashcardLearnScreen } from './screens/FlashcardLearnScreen'
import { MatchGameScreen } from './screens/MatchGameScreen'
import { ProgressScreen } from './screens/ProgressScreen'
import { LeaderboardScreen } from './screens/LeaderboardScreen'
import { ParentDashboardScreen } from './screens/ParentDashboardScreen'
import { AdminPanelScreen } from './screens/AdminPanelScreen'
import { GuideScreen } from './screens/GuideScreen'
import { WordProblemsScreen } from './screens/WordProblemsScreen'
import { StepSolverScreen } from './screens/StepSolverScreen'
import { AnnouncementBanner } from './common/AnnouncementBanner'
import { BottomNav } from './common/BottomNav'
import { QuickPlayFAB, XPBar, useSeason, ScreenTransition } from './common/GUIEffects'
import type { ViewKey } from '@/types'

export function AppShell() {
  const { user, isLoading } = useCurrentUser()
  const view = useAppStore((s) => s.view)
  const lang = useSettingsStore((s) => s.lang)
  const season = useSeason()

  // Apply age-band + seasonal attribute
  if (typeof document !== 'undefined') {
    if (user?.ageBand) document.documentElement.setAttribute('data-age-band', user.ageBand)
    document.documentElement.setAttribute('data-season', season)
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

  // Guide is accessible even without a logged-in user.
  if (!user && view === 'guide') return <GuideScreen />

  if (!user) return <AuthScreen />

  // Hydrate settings from server profile on first load.
  // (useSettingsStore hydrateFromUser is called in HomeScreen mount to avoid SSR mismatch.)

  return (
    <div className="mq-seasonal flex min-h-screen flex-col bg-background">
      <AnnouncementBanner />
      <Header />
      <XPBar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">
          <ScreenTransition view={view}>
            {renderView(view)}
          </ScreenTransition>
        </main>
      </div>
      <BottomNav />
      <QuickPlayFAB />
    </div>
  )
}

function renderView(view: ViewKey): React.ReactNode {
  switch (view) {
    case 'home':              return <HomeScreen />
    case 'worlds':            return <WorldMapScreen />
    case 'gameplay':          return <GameplayScreen />
    case 'settings':          return <SettingsScreen />
    case 'daily':             return <DailyChallengeScreen />
    case 'marketplace':       return <MarketplaceScreen />
    case 'collection':        return <CollectionScreen />
    case 'decks':             return <DecksScreen />
    case 'flashcard-learn':   return <FlashcardLearnScreen />
    case 'match-game':        return <MatchGameScreen />
    case 'progress':          return <ProgressScreen />
    case 'leaderboard':       return <LeaderboardScreen />
    case 'parent':            return <ParentDashboardScreen />
    case 'admin':             return <AdminPanelScreen />
    case 'guide':             return <GuideScreen />
    case 'word-problems':     return <WordProblemsScreen />
    case 'step-solver':       return <StepSolverScreen />
    default:                  return <HomeScreen />
  }
}
