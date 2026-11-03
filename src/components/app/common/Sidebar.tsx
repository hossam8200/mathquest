'use client'

// Side navigation: lists all main views. Adapts to role (parent/admin see extra items).
// On mobile it's a slide-in drawer; on desktop it's a fixed column.

import { useAppStore } from '@/store/app-store'
import { useSettingsStore } from '@/store/settings-store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useSound } from '@/hooks/use-sound'
import { t } from '@/lib/i18n'
import type { ViewKey } from '@/types'
import {
  Home, Map, ShoppingBag, FolderHeart, Layers,
  BarChart3, Trophy, CalendarHeart, ShieldCheck, Settings,
  ShieldHalf, X, BookOpen, FileText, Lightbulb,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  view: ViewKey
  labelKey: Parameters<typeof t>[1]
  icon: React.ReactNode
  roles?: string[] // restrict to roles
}

const ITEMS: NavItem[] = [
  { view: 'home',         labelKey: 'home',         icon: <Home className="h-5 w-5" /> },
  { view: 'worlds',       labelKey: 'worlds',       icon: <Map className="h-5 w-5" /> },
  { view: 'decks',        labelKey: 'flashcards',   icon: <Layers className="h-5 w-5" /> },
  { view: 'word-problems', labelKey: 'wordProblems', icon: <FileText className="h-5 w-5" /> },
  { view: 'step-solver',   labelKey: 'stepSolver',   icon: <Lightbulb className="h-5 w-5" /> },
  { view: 'marketplace',  labelKey: 'marketplace',  icon: <ShoppingBag className="h-5 w-5" /> },
  { view: 'collection',   labelKey: 'collection',   icon: <FolderHeart className="h-5 w-5" /> },
  { view: 'progress',     labelKey: 'progress',     icon: <BarChart3 className="h-5 w-5" /> },
  { view: 'leaderboard',  labelKey: 'leaderboard',  icon: <Trophy className="h-5 w-5" /> },
  { view: 'daily',        labelKey: 'daily',        icon: <CalendarHeart className="h-5 w-5" /> },
  { view: 'guide',        labelKey: 'guide',        icon: <BookOpen className="h-5 w-5" /> },
  { view: 'parent',       labelKey: 'parent',       icon: <ShieldHalf className="h-5 w-5" />, roles: ['child', 'parent'] },
  { view: 'admin',        labelKey: 'admin',        icon: <ShieldCheck className="h-5 w-5" />, roles: ['admin'] },
  { view: 'settings',     labelKey: 'settings',     icon: <Settings className="h-5 w-5" /> },
]

export function Sidebar() {
  const { user } = useCurrentUser()
  const view = useAppStore((s) => s.view)
  const go = useAppStore((s) => s.go)
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)
  const lang = useSettingsStore((s) => s.lang)
  const sfx = useSound()

  if (!user) return null

  const items = ITEMS.filter((it) => !it.roles || it.roles.includes(user.role))

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 z-50 flex w-72 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-out md:static md:w-64 md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          lang === 'ar' && 'right-0 md:right-auto'
        )}
      >
        <div className="flex items-center justify-between p-4 md:hidden">
          <span className="font-bold">{t(lang, 'appName')}</span>
          <button onClick={() => setSidebarOpen(false)} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 scroll-thin">
          <ul className="space-y-1">
            {items.map((it) => {
              const active = view === it.view
              return (
                <li key={it.view}>
                  <button
                    onClick={() => { sfx('click'); go({ view: it.view }) }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    {it.icon}
                    <span>{t(lang, it.labelKey)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t p-3 text-xs text-muted-foreground">
          <p>{t(lang, 'madeForKids')}</p>
        </div>
      </aside>
    </>
  )
}
