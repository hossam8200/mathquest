'use client'

// Home screen: greeting, big "Play" CTA, quick stats, operation picker.
// Stats are fetched from /api/progress/stats.

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { useSettingsStore } from '@/store/settings-store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useSound } from '@/hooks/use-sound'
import { t, type DictKey } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Mascot } from '../gameplay/Mascot'
import { Coins, Flame, Zap, Map as MapIcon } from 'lucide-react'
import type { Operation, ProgressStats } from '@/types'
import { cn } from '@/lib/utils'

const OPS: { key: Operation; emoji: string; color: string; labelKey: DictKey }[] = [
  { key: 'addition',       emoji: '➕', color: 'from-rose-400 to-orange-400',   labelKey: 'addition' },
  { key: 'subtraction',    emoji: '➖', color: 'from-sky-400 to-cyan-400',      labelKey: 'subtraction' },
  { key: 'multiplication', emoji: '✖️', color: 'from-emerald-400 to-teal-400', labelKey: 'multiplication' },
  { key: 'division',       emoji: '➗', color: 'from-fuchsia-400 to-purple-400', labelKey: 'division' },
  { key: 'mixed',          emoji: '🎲', color: 'from-amber-400 to-yellow-400', labelKey: 'mixed' },
]

export function HomeScreen() {
  const { user } = useCurrentUser()
  const go = useAppStore((s) => s.go)
  const setOp = useAppStore((s) => s.go)
  const lang = useSettingsStore((s) => s.lang)
  const hydrate = useSettingsStore((s) => s.hydrateFromUser)
  const sfx = useSound()

  const statsQ = useQuery<{ stats: ProgressStats }>({
    queryKey: ['stats'],
    queryFn: async () => {
      const r = await fetch('/api/progress/stats', { cache: 'no-store' })
      if (!r.ok) throw new Error()
      return r.json()
    },
    enabled: !!user,
  })
  const stats = statsQ.data?.stats

  // Fetch active parent quests (shown as a glowing notification)
  const questsQ = useQuery<{ quests: any[] }>({
    queryKey: ['quests'],
    queryFn: async () => {
      const r = await fetch('/api/quests', { cache: 'no-store' })
      if (!r.ok) return { quests: [] }
      return r.json()
    },
    enabled: !!user,
  })
  const activeQuests = questsQ.data?.quests ?? []

  // Sync client settings from the server profile (handles dark mode/lang/text scale).
  useEffect(() => {
    if (user) {
      hydrate({
        soundEnabled: user.soundEnabled,
        darkMode: user.darkMode,
        language: user.language,
        textScale: user.textScale,
      })
    }
  }, [user, hydrate])

  if (!user) return null

  const bandLabelKey =
    user.ageBand === '8-10' ? 'band_8_10' :
    user.ageBand === '11-13' ? 'band_11_13' :
    'band_14_16'

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      {/* Parent Quest notification — glowing banner */}
      {activeQuests.length > 0 && (
        <div
          className="mb-6 cursor-pointer rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-100 to-fuchsia-100 p-4 shadow-md dark:from-amber-950/30 dark:to-fuchsia-950/30 mq-float"
          onClick={() => { sfx('click'); go({ view: 'worlds' }) }}
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl mq-bounce">🛡️</div>
            <div className="flex-1">
              <div className="font-black text-amber-700 dark:text-amber-300">
                {lang === 'ar' ? 'مهمة خاصة من ولي الأمر!' : 'Special Quest from Parent!'}
              </div>
              <div className="text-sm text-muted-foreground">
                {activeQuests[0]?.message}
              </div>
              {activeQuests[0] && (
                <div className="mt-1 flex items-center gap-2">
                  <Progress value={(activeQuests[0].progress / activeQuests[0].target) * 100} className="h-1.5 w-32" />
                  <span className="text-xs font-bold">{activeQuests[0].progress}/{activeQuests[0].target}</span>
                  <span className="text-xs font-bold text-amber-600">+{activeQuests[0].rewardCoins} 🪙</span>
                </div>
              )}
            </div>
            <div className="text-2xl">→</div>
          </div>
        </div>
      )}

      {/* Greeting */}
      <div className="mb-6 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">
            {lang === 'ar' ? `أهلاً ${user.nickname}!` : `Hi, ${user.nickname}!`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(lang, 'tagline')} • {t(lang, bandLabelKey)}
          </p>
        </div>
        <Mascot size={64} />
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<Coins className="h-5 w-5" />} label={t(lang, 'coins')} value={user.coins} color="text-yellow-600" />
        <StatCard icon={<Flame className="h-5 w-5" />} label={t(lang, 'streak')} value={user.loginStreak} color="text-orange-600" />
        <StatCard icon={<Zap className="h-5 w-5" />} label={t(lang, 'points')} value={stats?.totalPoints ?? 0} color="text-amber-600" />
        <StatCard icon={<MapIcon className="h-5 w-5" />} label={lang === 'ar' ? 'مستويات' : 'Levels'} value={stats?.levelsCompleted ?? 0} color="text-emerald-600" />
      </div>

      {/* Big play CTA */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-400 via-rose-400 to-fuchsia-400 p-6 text-white">
          <h2 className="text-2xl font-black">{lang === 'ar' ? 'هل أنت مستعد؟' : 'Ready to play?'}</h2>
          <p className="mt-1 text-sm text-white/90">
            {lang === 'ar' ? 'اختر عملية وابدأ مغامرتك.' : 'Pick an operation and start your quest.'}
          </p>
          <Button
            className="mt-4 bg-white text-orange-600 hover:bg-white/90"
            onClick={() => { sfx('click'); go({ view: 'worlds' }) }}
          >
            {t(lang, 'play')} →
          </Button>
        </div>
      </Card>

      {/* Operation quick-pick */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-bold">{lang === 'ar' ? 'اختر عملية' : 'Pick an operation'}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {OPS.map((op) => (
          <button
            key={op.key}
            onClick={() => {
              sfx('click')
              setOp({ view: 'worlds' })
              useAppStore.setState({ selectedOp: op.key })
            }}
            className={cn(
              'group flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br p-4 text-white shadow-md transition hover:-translate-y-1 hover:shadow-lg',
              op.color
            )}
          >
            <span className="text-3xl md:text-4xl">{op.emoji}</span>
            <span className="text-xs font-bold md:text-sm">{t(lang, op.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* Quick links */}
      <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
        <QuickLink emoji="🃏" title={t(lang, 'flashcards')} onClick={() => go({ view: 'decks' })} />
        <QuickLink emoji="🛒" title={t(lang, 'marketplace')} onClick={() => go({ view: 'marketplace' })} />
        <QuickLink emoji="📅" title={t(lang, 'dailyChallenge')} onClick={() => go({ view: 'daily' })} />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-full bg-muted', color)}>
          {icon}
        </div>
        <div>
          <div className="text-xl font-black">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickLink({ emoji, title, onClick }: { emoji: string; title: string; onClick: () => void }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="flex h-20 items-center justify-start gap-3 px-5 text-base"
    >
      <span className="text-3xl">{emoji}</span>
      <span className="font-bold">{title}</span>
    </Button>
  )
}
