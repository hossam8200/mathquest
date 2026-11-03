'use client'

// Progress screen: total stats, accuracy by operation (bar chart),
// points over time (line chart), badges grid, study streak.

import { useQuery } from '@tanstack/react-query'
import { useSettingsStore } from '@/store/settings-store'
import { useAppStore } from '@/store/app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Zap, Coins, Target, Flame, Map as MapIcon, Layers, Trophy } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  BarChart, Bar,
} from 'recharts'
import { t } from '@/lib/i18n'
import { avatarUrl } from '@/lib/dicebear'
import type { ProgressStats, BadgeInfo } from '@/types'
import { cn } from '@/lib/utils'

const OP_LABELS: Record<string, string> = {
  addition: '➕',
  subtraction: '➖',
  multiplication: '✖️',
  division: '➗',
  mixed: '🎲',
}

export function ProgressScreen() {
  const lang = useSettingsStore((s) => s.lang)
  const go = useAppStore((s) => s.go)

  const statsQ = useQuery<{ stats: ProgressStats }>({
    queryKey: ['stats'],
    queryFn: async () => {
      const r = await fetch('/api/progress/stats', { cache: 'no-store' })
      if (!r.ok) throw new Error()
      return r.json()
    },
  })
  const badgesQ = useQuery<{ badges: BadgeInfo[] }>({
    queryKey: ['badges'],
    queryFn: async () => {
      const r = await fetch('/api/progress/badges', { cache: 'no-store' })
      if (!r.ok) throw new Error()
      return r.json()
    },
  })

  const stats = statsQ.data?.stats
  const badges = badgesQ.data?.badges ?? []
  const earnedBadges = badges.filter((b) => b.earned)

  const accuracyData = stats ? Object.entries(stats.accuracyByOp).map(([op, pct]) => ({
    op: OP_LABELS[op] ?? op, pct,
  })) : []

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-10">
      <Button variant="ghost" size="sm" onClick={() => go({ view: 'home' })} className="mb-3">
        <ChevronLeft className="mr-1 h-4 w-4" /> {t(lang, 'back')}
      </Button>
      <h1 className="mb-6 flex items-center gap-2 text-3xl font-black">
        📊 {t(lang, 'progress')}
      </h1>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<Zap className="h-5 w-5" />} label={t(lang, 'points')} value={stats?.totalPoints ?? 0} color="text-amber-600" />
        <StatCard icon={<Coins className="h-5 w-5" />} label={t(lang, 'coins')} value={stats?.totalCoins ?? 0} color="text-yellow-600" />
        <StatCard icon={<MapIcon className="h-5 w-5" />} label={lang === 'ar' ? 'مستويات' : 'Levels'} value={stats?.levelsCompleted ?? 0} color="text-emerald-600" />
        <StatCard icon={<Layers className="h-5 w-5" />} label={lang === 'ar' ? 'بطاقات متقنة' : 'Cards mastered'} value={stats?.cardsMastered ?? 0} color="text-fuchsia-600" />
        <StatCard icon={<Flame className="h-5 w-5" />} label={t(lang, 'studyStreak')} value={`${stats?.studyStreak ?? 0} ${t(lang, 'days')}`} color="text-orange-600" />
        <StatCard icon={<Trophy className="h-5 w-5" />} label={t(lang, 'longestStreak')} value={`${stats?.longestStudyStreak ?? 0} ${t(lang, 'days')}`} color="text-rose-600" />
        <StatCard icon={<Target className="h-5 w-5" />} label={lang === 'ar' ? 'أفضل تتابع' : 'Best streak'} value={stats?.bestStreak ?? 0} color="text-sky-600" />
        <StatCard icon={<Trophy className="h-5 w-5" />} label={t(lang, 'badges')} value={earnedBadges.length} color="text-purple-600" />
      </div>

      {/* Charts */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {/* Points over time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{lang === 'ar' ? 'النقاط (7 أيام)' : 'Points (7 days)'}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.pointsOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats.pointsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RTooltip />
                  <Line type="monotone" dataKey="points" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'لا بيانات بعد.' : 'No data yet.'}</p>
            )}
          </CardContent>
        </Card>

        {/* Accuracy by operation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{lang === 'ar' ? 'الدقة حسب العملية' : 'Accuracy by operation'}</CardTitle>
          </CardHeader>
          <CardContent>
            {accuracyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={accuracyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="op" tick={{ fontSize: 14 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <RTooltip />
                  <Bar dataKey="pct" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'العب مستوى لرؤية البيانات.' : 'Play a level to see data.'}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t(lang, 'badges')} ({earnedBadges.length}/{badges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-8">
            {badges.map((b) => (
              <div
                key={b.id}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-center',
                  b.earned ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30' : 'border-muted opacity-50'
                )}
                title={b.description}
              >
                <img src={avatarUrl(b.key, 'thumbs', 32)} alt={b.name} width={32} height={32} className="rounded-full" loading="lazy" />
                <span className="text-[9px] font-bold leading-tight">{b.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted', color)}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="truncate text-lg font-black">{value}</div>
          <div className="truncate text-[10px] text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}
