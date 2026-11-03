'use client'

// Mobile bottom navigation bar — shows on phones only (md:hidden).
// 5 quick-access items + "More" opens the sidebar drawer.
// The hamburger in the header stays for full nav access.

import { useAppStore } from '@/store/app-store'
import { useSound } from '@/hooks/use-sound'
import { Home, Gamepad2, Layers, ShoppingBag, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { view: 'home' as const, icon: Home, label: 'Home' },
  { view: 'worlds' as const, icon: Gamepad2, label: 'Play' },
  { view: 'decks' as const, icon: Layers, label: 'Cards' },
  { view: 'marketplace' as const, icon: ShoppingBag, label: 'Shop' },
]

export function BottomNav() {
  const view = useAppStore((s) => s.view)
  const go = useAppStore((s) => s.go)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)
  const sfx = useSound()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch border-t bg-background/95 backdrop-blur md:hidden"
      aria-label="Quick navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {ITEMS.map((item) => {
        const active = view === item.view
        return (
          <button
            key={item.view}
            onClick={() => { sfx('click'); go({ view: item.view }) }}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors',
              active ? 'text-primary' : 'text-muted-foreground'
            )}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
          >
            <item.icon className={cn('h-5 w-5', active && 'scale-110')} strokeWidth={active ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{item.label}</span>
            {active && <div className="absolute bottom-0 h-0.5 w-8 rounded-full bg-primary" />}
          </button>
        )
      })}
      {/* More button — opens sidebar drawer */}
      <button
        onClick={() => { sfx('click'); setSidebarOpen(true) }}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="More"
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
        <span className="text-[10px] font-bold">More</span>
      </button>
    </nav>
  )
}
