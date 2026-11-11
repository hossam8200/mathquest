'use client'

// GUI Effects components — all 15 ideas in reusable components.
// Ideas: ProgressRing, FloatingBubbles, CoinShower, QuickPlayFAB, XPBar,
// ScreenTransition, SeasonalDetector, WorldBackground, StreakFlame

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { useSettingsStore } from '@/store/settings-store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useQuery } from '@tanstack/react-query'
import { Zap, BookOpen, Trophy, Gift } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProgressStats } from '@/types'

// ─── IDEA 3: Progress Ring ───
export function ProgressRing({ percent, size = 80, stroke = 6, color = 'var(--primary)', label }: { percent: number; size?: number; stroke?: number; color?: string; label?: string }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="mq-progress-ring">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="oklch(0.90 0.02 50)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="mq-glow-ring" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-black">{label ?? `${Math.round(percent)}%`}</span>
      </div>
    </div>
  )
}

// ─── IDEA 4: Floating Achievement Bubbles ───
let bubbleId = 0
export function useAchievementBubbles() {
  const [bubbles, setBubbles] = useState<{ id: number; text: string; color: string }[]>([])
  const show = (text: string, color = 'bg-amber-500') => {
    const id = ++bubbleId
    setBubbles(prev => [...prev, { id, text, color }])
    setTimeout(() => setBubbles(prev => prev.filter(b => b.id !== id)), 2500)
  }
  return { bubbles, show }
}

export function FloatingBubbles({ bubbles }: { bubbles: { id: number; text: string; color: string }[] }) {
  return (
    <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 md:bottom-8">
      {bubbles.map(b => (
        <div key={b.id} className={cn('mq-bubble mb-2 rounded-2xl px-4 py-2 text-sm font-bold text-white shadow-lg', b.color)}>
          {b.text}
        </div>
      ))}
    </div>
  )
}

// ─── IDEA 7: Quick Play FAB ───
export function QuickPlayFAB() {
  const go = useAppStore(s => s.go)
  const { user } = useCurrentUser()
  const sfx = useSettingsStore.getState().soundEnabled

  // Determine recommended action
  const statsQ = useQuery<{ stats: ProgressStats }>({
    queryKey: ['stats'],
    queryFn: async () => { const r = await fetch('/api/progress/stats', { cache: 'no-store' }); if (!r.ok) throw new Error(); return r.json() },
    enabled: !!user,
  })
  const dailyQ = useQuery<{ challenges: any[] }>({
    queryKey: ['daily-multi'],
    queryFn: async () => { const r = await fetch('/api/progress/daily', { cache: 'no-store' }); if (!r.ok) throw new Error(); return r.json() },
    enabled: !!user,
  })

  if (!user) return null

  // Find unclaimed completed challenge
  const unclaimed = dailyQ.data?.challenges?.find(c => c.completed && !c.claimed)
  // Find due flashcards
  const cardsProgress = dailyQ.data?.challenges?.find(c => c.type === 'cards')
  const hasCardsTodo = cardsProgress && cardsProgress.progress < cardsProgress.target

  let icon = <Zap className="h-6 w-6" />
  let label = 'Play'
  let action = () => go({ view: 'worlds' })

  if (unclaimed) {
    icon = <Gift className="h-6 w-6" />
    label = 'Claim'
    action = () => go({ view: 'daily' })
  } else if (hasCardsTodo) {
    icon = <BookOpen className="h-6 w-6" />
    label = 'Study'
    action = () => go({ view: 'decks' })
  }

  return (
    <button
      onClick={() => { if (sfx) import('@/lib/sounds').then(s => s.play('click')); action() }}
      className="mq-fab fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl md:bottom-6"
      aria-label={label}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </button>
  )
}

// ─── IDEA 9: XP Bar ───
export function XPBar() {
  const { user } = useCurrentUser()
  const statsQ = useQuery<{ stats: ProgressStats }>({
    queryKey: ['stats'],
    queryFn: async () => { const r = await fetch('/api/progress/stats', { cache: 'no-store' }); if (!r.ok) throw new Error(); return r.json() },
    enabled: !!user,
    staleTime: 0,
  })
  if (!user || !statsQ.data?.stats) return null
  const totalPoints = statsQ.data.stats.totalPoints
  // Explorer level = every 500 points
  const level = Math.floor(totalPoints / 500) + 1
  const currentLevelPoints = totalPoints % 500
  const pct = (currentLevelPoints / 500) * 100
  return (
    <div className="hidden md:flex items-center gap-2 px-2">
      <span className="text-xs font-bold text-muted-foreground">Lvl {level}</span>
      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
        <div className="mq-xp-bar h-full rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ─── IDEA 11: Streak Flame ───
export function StreakFlame({ streak }: { streak: number }) {
  const flameClass = streak >= 7 ? 'mq-flame-7' : streak >= 3 ? 'mq-flame-3' : streak >= 1 ? 'mq-flame-1' : ''
  const size = streak >= 7 ? 'text-base' : streak >= 3 ? 'text-sm' : 'text-xs'
  return (
    <div className={cn('flex items-center gap-0.5', streak >= 7 && 'text-orange-500', streak >= 3 && streak < 7 && 'text-amber-500')}>
      <span className={cn(flameClass, size)}>🔥</span>
      <span className="font-bold">{streak}</span>
    </div>
  )
}

// ─── IDEA 12: Coin Shower ───
export function CoinShower({ trigger }: { trigger: number }) {
  const [coins, setCoins] = useState<number[]>([])
  useEffect(() => {
    if (trigger > 0) {
      const newCoins = Array.from({ length: 12 }, (_, i) => i)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCoins(newCoins)
      const t = setTimeout(() => setCoins([]), 2000)
      return () => clearTimeout(t)
    }
  }, [trigger])
  if (coins.length === 0) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {coins.map(i => (
        <div key={i} className="mq-coin-shower absolute text-2xl" style={{ left: `${10 + (i * 7)}%`, animationDelay: `${i * 0.08}s` }}>
          🪙
        </div>
      ))}
    </div>
  )
}

// ─── IDEA 2: Screen Transition Wrapper ───
export function ScreenTransition({ children, view }: { children: React.ReactNode; view: string }) {
  return (
    <div key={view} className="mq-screen-enter">
      {children}
    </div>
  )
}

// ─── IDEA 15: Seasonal Detector ───
export function useSeason() {
  const [season, setSeason] = useState<string>(() => {
    if (typeof window === 'undefined') return 'none'
    const month = new Date().getMonth()
    if (month === 11 || month === 0 || month === 1) return 'winter'
    if (month === 2 || month === 3 || month === 4) return 'spring'
    if (month === 5 || month === 6 || month === 7) return 'summer'
    return 'autumn'
  })
  return season
}

// ─── IDEA 5: World Background ───
export function WorldBackground({ world }: { world?: string }) {
  if (!world) return null
  const bgClass = `mq-bg-${world}`
  const decorations: Record<string, string[]> = {
    addition: ['🌊', '☀️', '🐚', '🌴'],
    subtraction: ['🍃', '🦋', '🌿', '🪲'],
    multiplication: ['❄️', '🏔️', '⛰️', '🧗'],
    division: '🌵,🦂,🏜️,☀️'.split(','),
    mixed: ['⭐', '🌟', '🪐', '🚀'],
  }
  const decos = decorations[world] ?? []
  return (
    <div className={cn('pointer-events-none fixed inset-0 -z-10', bgClass)}>
      {decos.map((emoji, i) => (
        <span
          key={i}
          className="absolute text-2xl opacity-30"
          style={{
            left: `${5 + i * 22}%`,
            top: `${10 + (i % 3) * 25}%`,
            animation: `mq-float ${3 + i}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  )
}
