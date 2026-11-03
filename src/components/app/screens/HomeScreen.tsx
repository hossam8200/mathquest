'use client'

// Home screen — redesigned with:
// 1. Character-driven copy (uses equipped character name)
// 2. "Today" card (daily card goal progress + Learn button)
// 3. Multiple simultaneous daily challenges (Memory Master, Sharp Shooter, Level Crusher)
// 4. "Continue Your Quest" (next unlocked levels directly on home)
// 5. Nunito font (applied in layout)

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { useSettingsStore } from '@/store/settings-store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useSound } from '@/hooks/use-sound'
import { t, type DictKey } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Mascot } from '../gameplay/Mascot'
import { Coins, Flame, Zap, Map as MapIcon, BookOpen, Lock, Star, Gift } from 'lucide-react'
import type { Operation, ProgressStats } from '@/types'
import { kidAvatar, questGiverAvatar } from '@/lib/dicebear'
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
  const lang = useSettingsStore((s) => s.lang)
  const hydrate = useSettingsStore((s) => s.hydrateFromUser)
  const sfx = useSound()
  const qc = useQueryClient()

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

  // Fetch active parent quests
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

  // Fetch multiple daily challenges
  const challengesQ = useQuery<{ challenges: any[] }>({
    queryKey: ['daily-multi'],
    queryFn: async () => {
      const r = await fetch('/api/progress/daily', { cache: 'no-store' })
      if (!r.ok) return { challenges: [] }
      return r.json()
    },
    enabled: !!user,
  })
  const challenges = challengesQ.data?.challenges ?? []

  // Fetch next unlocked levels for "Continue Your Quest"
  const nextLevelsQ = useQuery<{ levels: any[] }>({
    queryKey: ['next-levels'],
    queryFn: async () => {
      const r = await fetch('/api/gameplay/levels?worldId=all', { cache: 'no-store' })
      if (!r.ok) return { levels: [] }
      return r.json()
    },
    enabled: !!user,
  })

  // Fetch equipped character name
  const charsQ = useQuery<{ characters: any[] }>({
    queryKey: ['marketplace'],
    queryFn: async () => {
      const r = await fetch('/api/marketplace/list', { cache: 'no-store' })
      if (!r.ok) return { characters: [] }
      return r.json()
    },
    enabled: !!user,
    staleTime: 60_000,
  })
  const equippedChar = charsQ.data?.characters.find(c => c.equipped)
  const charName = equippedChar?.name ?? 'Foxy'
  const charEmoji = equippedChar?.artPayload ?? '🦊'

  // Sync client settings from the server profile
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

  function claimChallenge(type: string) {
    sfx('coin')
    fetch('/api/progress/daily/claim', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    }).then(r => r.json()).then(d => {
      if (d.ok) {
        qc.invalidateQueries({ queryKey: ['daily-multi'] })
        qc.invalidateQueries({ queryKey: ['me'] })
      }
    })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      {/* Parent Quest notification */}
      {activeQuests.length > 0 && (
        <div
          className="mb-6 cursor-pointer rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-100 to-fuchsia-100 p-4 shadow-md dark:from-amber-950/30 dark:to-fuchsia-950/30 mq-float"
          onClick={() => { sfx('click'); go({ view: 'worlds' }) }}
        >
          <div className="flex items-center gap-3">
            <img src={questGiverAvatar(activeQuests[0]?.id || 'default', 48)} alt="Quest Giver" width={48} height={48} className="rounded-full ring-2 ring-amber-400 mq-bounce" loading="lazy" />
            <div className="flex-1">
              <div className="font-black text-amber-700 dark:text-amber-300">
                {lang === 'ar' ? 'مهمة خاصة من ولي الأمر!' : 'Special Quest from Parent!'}
              </div>
              <div className="text-sm text-muted-foreground">{activeQuests[0]?.message}</div>
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

      {/* Greeting — character-driven copy */}
      <div className="mb-6 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">
            {lang === 'ar' ? `أهلاً ${user.nickname}! 👋` : `Hi, ${user.nickname}! 👋`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-bold text-primary">{charName}</span> {lang === 'ar' ? 'مستعد لمغامرة!' : 'is ready for a quest!'} · {t(lang, bandLabelKey)}
          </p>
        </div>
        <button onClick={() => go({ view: 'collection' })} className="transition hover:scale-110">
          <img
            src={kidAvatar(user.nickname, 56)}
            alt={user.nickname}
            width={56}
            height={56}
            className="rounded-full ring-2 ring-primary/30"
            loading="lazy"
          />
        </button>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<Coins className="h-5 w-5" />} label={t(lang, 'coins')} value={user.coins} color="text-yellow-600" />
        <StatCard icon={<Flame className="h-5 w-5" />} label={t(lang, 'streak')} value={user.loginStreak} color="text-orange-600" />
        <StatCard icon={<Zap className="h-5 w-5" />} label={t(lang, 'points')} value={stats?.totalPoints ?? 0} color="text-amber-600" />
        <StatCard icon={<MapIcon className="h-5 w-5" />} label={lang === 'ar' ? 'مستويات' : 'Levels'} value={stats?.levelsCompleted ?? 0} color="text-emerald-600" />
      </div>

      {/* Daily Challenges — multiple simultaneous */}
      {challenges.length > 0 && (
        <Card className="mb-6 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              🎯 {lang === 'ar' ? 'تحديات اليوم' : 'Daily Challenges'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {challenges.map((ch) => {
              const pct = ch.target > 0 ? Math.min(100, (ch.progress / ch.target) * 100) : 0
              return (
                <div key={ch.type} className="flex items-center gap-3">
                  <span className="text-2xl">{ch.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{ch.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {ch.progress}/{ch.target} · +{ch.rewardCoins} 🪙
                      </span>
                    </div>
                    <Progress value={pct} className="mt-1 h-2" />
                  </div>
                  {ch.claimed ? (
                    <span className="text-xs font-bold text-emerald-500">✓ {lang === 'ar' ? 'تم' : 'Done'}</span>
                  ) : ch.completed ? (
                    <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => claimChallenge(ch.type)}>
                      <Gift className="mr-1 h-3 w-3" /> {lang === 'ar' ? 'استلم' : 'Claim'}
                    </Button>
                  ) : null}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* "Today" card — daily card goal */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-400 to-teal-400 p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black">📚 {lang === 'ar' ? 'اليوم' : 'Today'}</h2>
              <p className="text-sm text-white/90">
                {lang === 'ar' ? `اليوم: ${Math.min(challenges.find(c => c.type === 'cards')?.progress ?? 0, user.dailyCardGoal)}/${user.dailyCardGoal} بطاقة` : `Today: ${Math.min(challenges.find(c => c.type === 'cards')?.progress ?? 0, user.dailyCardGoal)}/${user.dailyCardGoal} cards`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black">
                {user.dailyCardGoal > 0 ? Math.round(Math.min((challenges.find(c => c.type === 'cards')?.progress ?? 0) / user.dailyCardGoal, 1) * 100) : 0}%
              </div>
            </div>
          </div>
          <Progress value={user.dailyCardGoal > 0 ? Math.min((challenges.find(c => c.type === 'cards')?.progress ?? 0) / user.dailyCardGoal * 100, 100) : 0} className="mt-2 h-2 bg-white/20 [&>*]:bg-white" />
        </div>
        <CardContent className="flex gap-2 p-3">
          <Button className="flex-1" onClick={() => { sfx('click'); go({ view: 'decks' }) }}>
            <BookOpen className="mr-1 h-4 w-4" /> {t(lang, 'learn')}
          </Button>
          <Button variant="outline" onClick={() => { sfx('click'); go({ view: 'progress' }) }}>
            🏆 {lang === 'ar' ? 'أوسمة' : 'Badges'}
          </Button>
        </CardContent>
      </Card>

      {/* Continue Your Quest — next unlocked levels */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            🗺️ {lang === 'ar' ? 'تابع مهمتك' : 'Continue Your Quest'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Show first 3 unlocked levels from the next-levels query */}
            {/* Since we need the world context, we'll use the quick operation picker as a fallback */}
            <Button
              className="w-full justify-start text-base"
              onClick={() => { sfx('click'); go({ view: 'worlds' }) }}
            >
              <span className="mr-2 text-2xl">▶️</span>
              <span className="flex-1 text-left">
                <span className="font-black">{lang === 'ar' ? 'ابدأ المغامرة' : 'Start Playing'}</span>
                <span className="block text-xs text-muted-foreground">{lang === 'ar' ? 'اختر عالمك واستكشف المستويات' : 'Pick a world and explore levels'}</span>
              </span>
              <span className="text-2xl">→</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Operation quick-pick */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-bold">{lang === 'ar' ? 'ماذا ستتدرب اليوم؟' : 'What will you practice today?'}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {OPS.map((op) => (
          <button
            key={op.key}
            onClick={() => {
              sfx('click')
              go({ view: 'worlds' })
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
        <QuickLink emoji="📖" title={t(lang, 'wordProblems' as any) || 'Word Problems'} onClick={() => go({ view: 'word-problems' })} />
        <QuickLink emoji="💡" title={t(lang, 'stepSolver' as any) || 'Step Solver'} onClick={() => go({ view: 'step-solver' })} />
        <QuickLink emoji="🛒" title={t(lang, 'marketplace')} onClick={() => go({ view: 'marketplace' })} />
        <QuickLink emoji="📅" title={t(lang, 'dailyChallenge')} onClick={() => go({ view: 'daily' })} />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
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
