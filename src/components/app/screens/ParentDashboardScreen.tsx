'use client'

// Enhanced Parent Dashboard — redesigned with:
// 1. Weekly study time chart (bar chart, 7 days)
// 2. Accuracy trend chart (line chart, 7 days)
// 3. Smart recommendations (suggest decks based on weak areas)
// 4. Study calendar heatmap (14 days)
// 5. Badges earned this week
// 6. Weak cards list with practice button
// 7. Quick actions (assign deck, set limits, send coins)
// 8. Progress summary (levels, stars, streaks)

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSettingsStore } from '@/store/settings-store'
import { useAppStore } from '@/store/app-store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useSound } from '@/hooks/use-sound'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Badge as UiBadge } from '@/components/ui/badge'
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip } from 'recharts'
import { ChevronLeft, Lock, Clock, Target, Flame, TrendingDown, BookOpen, Settings, Star, Trophy, Zap, Calendar, Lightbulb, Gift, CheckCircle2 } from 'lucide-react'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function ParentDashboardScreen() {
  const lang = useSettingsStore((s) => s.lang)
  const go = useAppStore((s) => s.go)
  const { user } = useCurrentUser()
  const sfx = useSound()
  const { toast } = useToast()
  const [pin, setPin] = useState('')
  const [unlocked, setUnlocked] = useState(false)

  const verifyMut = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/parent/verify-pin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      return r.json()
    },
    onSuccess: (d) => {
      if (d.ok) { sfx('click'); setUnlocked(true) }
      else { sfx('wrong'); toast({ title: lang === 'ar' ? 'رمز خاطئ' : 'Wrong PIN', variant: 'destructive' }) }
    },
  })

  if (!user?.hasParentPin) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-bold">{lang === 'ar' ? 'لم يتم تعيين رمز ولي الأمر' : 'No parent PIN set'}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === 'ar' ? 'يمكن تعيين رمز ولي الأمر عند إنشاء الحساب.' : 'A parent PIN can be set during account creation.'}
        </p>
        <Button className="mt-4" onClick={() => go({ view: 'home' })}>{t(lang, 'back')}</Button>
      </div>
    )
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <div className="text-6xl mq-bounce">🔐</div>
        <h2 className="mt-4 text-xl font-bold">{t(lang, 'enterPin')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === 'ar' ? 'أدخل رمز ولي الأمر من 4 أرقام' : 'Enter the 4-digit parent PIN'}
        </p>
        <form onSubmit={(e) => { e.preventDefault(); verifyMut.mutate() }} className="mt-4 space-y-3">
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            className="mx-auto max-w-32 text-center text-2xl tracking-widest"
            autoFocus
          />
          <Button type="button" onClick={() => verifyMut.mutate()} disabled={pin.length !== 4 || verifyMut.isPending} className="w-full">
            <Lock className="mr-1 h-4 w-4" /> {t(lang, 'confirm')}
          </Button>
          <Button type="button" variant="ghost" onClick={() => go({ view: 'home' })}>{t(lang, 'back')}</Button>
        </form>
      </div>
    )
  }

  return <DashboardContent />
}

function DashboardContent() {
  const lang = useSettingsStore((s) => s.lang)
  const go = useAppStore((s) => s.go)
  const { user } = useCurrentUser()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [timeLimit, setTimeLimit] = useState(60)
  const [cardGoal, setCardGoal] = useState(20)
  const [encourageMsg, setEncourageMsg] = useState('')
  const [encourageCoins, setEncourageCoins] = useState(20)

  const { data, isLoading } = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: async () => {
      const r = await fetch('/api/parent/dashboard', { cache: 'no-store' })
      if (!r.ok) throw new Error()
      const d = await r.json()
      setTimeLimit(d.dailyTimeLimitMins)
      setCardGoal(d.dailyCardGoal)
      return d
    },
  })

  const assignMut = useMutation({
    mutationFn: async ({ deckId, assign }: { deckId: string; assign: boolean }) => {
      const r = await fetch('/api/parent/assign-deck', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId, assign }),
      })
      return r.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent-dashboard'] }),
  })

  const settingsMut = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/parent/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyTimeLimitMins: timeLimit, dailyCardGoal: cardGoal }),
      })
      return r.json()
    },
    onSuccess: () => {
      toast({ title: lang === 'ar' ? 'تم الحفظ' : 'Settings saved' })
      qc.invalidateQueries({ queryKey: ['parent-dashboard'] })
    },
  })

  // Encourage = grant coins via admin API (parent acts as admin for their child)
  const encourageMut = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/admin/users/${user?.id}/grant-coins`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: encourageCoins, reason: 'parent_encouragement' }),
      })
      return r.json()
    },
    onSuccess: () => {
      sfx('coin')
      toast({ title: `🎁 +${encourageCoins} coins sent to ${data?.childName}!` })
      setEncourageMsg('')
      qc.invalidateQueries({ queryKey: ['parent-dashboard'] })
    },
  })

  if (isLoading) return <div className="mx-auto max-w-2xl px-4 py-10 text-center text-muted-foreground">Loading…</div>
  if (!data) return null

  const hours = Math.floor(data.timePlayedTodaySec / 3600)
  const mins = Math.floor((data.timePlayedTodaySec % 3600) / 60)
  const ar = lang === 'ar'

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      <Button variant="ghost" size="sm" onClick={() => go({ view: 'home' })} className="mb-3">
        <ChevronLeft className="mr-1 h-4 w-4" /> {t(lang, 'back')}
      </Button>

      {/* Header with child info */}
      <div className="mb-6 flex items-center gap-4">
        <div className="text-5xl">{data.avatarCharacterId ? '🦊' : '👤'}</div>
        <div>
          <h1 className="text-2xl font-black">{data.childName}</h1>
          <p className="text-sm text-muted-foreground">
            {ar ? `فئة ${data.ageBand}` : `Age ${data.ageBand}`} · {ar ? 'لوحة ولي الأمر' : 'Parent Dashboard'}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<Clock className="h-5 w-5 text-sky-500" />} label={ar ? 'وقت اليوم' : 'Today'} value={`${hours}h ${mins}m`} />
        <StatCard icon={<Target className="h-5 w-5 text-emerald-500" />} label={ar ? 'مستويات' : 'Levels'} value={data.levelsCompleted} />
        <StatCard icon={<Star className="h-5 w-5 text-amber-500" />} label={ar ? 'نجوم' : 'Stars'} value={data.totalStars} />
        <StatCard icon={<Flame className="h-5 w-5 text-orange-500" />} label={ar ? 'تتابع' : 'Streak'} value={`${data.studyStreak} ${ar ? 'يوم' : 'days'}`} />
      </div>

      {/* Weekly study chart */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            {ar ? 'وقت الدراسة (7 أيام)' : 'Study Time (7 days)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.weeklyStudy}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="m" />
              <RTooltip />
              <Bar dataKey="minutes" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Accuracy trend */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingDown className="h-4 w-4 text-amber-500" />
            {ar ? 'اتجاه الدقة (7 أيام)' : 'Accuracy Trend (7 days)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={data.accuracyTrend}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
              <RTooltip />
              <Line type="monotone" dataKey="accuracy" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Study calendar heatmap */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">{ar ? 'أيام الدراسة (14 يوم)' : 'Study Days (14 days)'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between gap-1">
            {data.studyDays.map((day: { date: string; studied: boolean }, i: number) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'h-8 w-8 rounded-lg',
                    day.studied ? 'bg-emerald-500' : 'bg-muted'
                  )}
                  title={`${day.date}: ${day.studied ? 'Studied' : 'No activity'}`}
                />
                <span className="text-[8px] text-muted-foreground">{day.date}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Smart recommendations */}
      {data.recommendations.length > 0 && (
        <Card className="mb-4 border-2 border-amber-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-amber-600">
              <Lightbulb className="h-4 w-4" />
              {ar ? 'توصيات ذكية' : 'Smart Recommendations'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recommendations.map((rec: any) => (
              <div key={rec.id} className="flex items-center justify-between rounded-lg bg-amber-50 p-2 dark:bg-amber-950/20">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{rec.coverIcon}</span>
                  <div>
                    <div className="text-sm font-bold">{rec.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {ar ? `يحتاج تدريب في ${rec.operation}` : `Needs practice in ${rec.operation}`}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => assignMut.mutate({ deckId: rec.id, assign: true })}>
                  {ar ? 'إسناد' : 'Assign'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Weak areas */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingDown className="h-4 w-4 text-rose-500" />
            {t(lang, 'weakAreas')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.weakAreas.length === 0 ? (
            <p className="text-sm text-muted-foreground">{ar ? 'لا توجد بيانات بعد.' : 'No data yet.'}</p>
          ) : (
            <div className="space-y-2">
              {data.weakAreas.map((w: { operation: string; accuracy: number }) => (
                <div key={w.operation} className="flex items-center justify-between">
                  <span className="font-bold capitalize">{w.operation}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={w.accuracy} className={cn('h-2 w-32', w.accuracy < 50 && '[&>*]:bg-rose-500')} />
                    <span className={cn('text-sm font-bold', w.accuracy < 50 ? 'text-rose-500' : 'text-emerald-500')}>{w.accuracy}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deck mastery */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">{ar ? 'إتقان المجموعات' : 'Deck Mastery'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-48 space-y-2 overflow-y-auto scroll-thin">
            {data.deckMastery.map((d: { id: string; title: string; coverIcon: string; masteryPct: number; cardCount: number; assigned: boolean }) => (
              <div key={d.id} className="flex items-center justify-between text-sm">
                <span className="truncate">
                  {d.coverIcon} {d.title}
                  {d.assigned && <UiBadge className="ml-1 text-[9px]">📌</UiBadge>}
                </span>
                <div className="flex items-center gap-2">
                  <Progress value={d.masteryPct} className="h-2 w-20" />
                  <span className="text-xs font-bold">{d.masteryPct}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Badges earned this week */}
      {data.weekBadges.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-amber-500" />
              {ar ? 'أوسمة هذا الأسبوع' : 'Badges This Week'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {data.weekBadges.map((b: { badge: { emoji: string; name: string } }, i: number) => (
                <div key={i} className="flex items-center gap-2 rounded-xl bg-amber-50 p-2 dark:bg-amber-950/20">
                  <span className="text-2xl">{b.badge.emoji}</span>
                  <span className="text-sm font-bold">{b.badge.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weak cards */}
      {data.weakCards.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">{ar ? 'بطاقات تحتاج مراجعة' : 'Cards to Review'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {data.weakCards.slice(0, 8).map((c: { front: string; back: string; deckTitle: string; status: string }, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-muted px-2 py-1 text-sm">
                  <span className="font-mono font-bold">{c.front} = {c.back}</span>
                  <span className="text-xs text-muted-foreground">{c.deckTitle}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Encouragement — send coins with message */}
      <Card className="mb-4 border-2 border-emerald-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-emerald-600">
            <Gift className="h-4 w-4" />
            {ar ? 'أرسل تشجيعاً' : 'Send Encouragement'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {ar ? 'أرسل عملات إضافية لطفلك ك награда!' : 'Send bonus coins to your child as a reward!'}
          </p>
          <div className="flex gap-2">
            <div className="flex gap-1">
              {[10, 20, 50, 100].map(v => (
                <Button key={v} size="sm" variant={encourageCoins === v ? 'default' : 'outline'} onClick={() => setEncourageCoins(v)}>
                  {v}
                </Button>
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={() => encourageMut.mutate()} disabled={encourageMut.isPending}>
            <Gift className="mr-1 h-4 w-4" /> {ar ? `أرسل ${encourageCoins} عملة` : `Send ${encourageCoins} coins`}
          </Button>
        </CardContent>
      </Card>

      {/* Assign decks */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">{ar ? 'إسناد مجموعات' : 'Assign Decks'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-48 space-y-1 overflow-y-auto scroll-thin">
            {data.allBuiltin.map((d: { id: string; title: string; coverIcon: string; ageBand: string; operation: string; assigned: boolean }) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border p-2">
                <span className="text-sm">
                  {d.coverIcon} {d.title} <span className="text-xs text-muted-foreground">({d.ageBand})</span>
                </span>
                <Switch checked={d.assigned} onCheckedChange={(v) => assignMut.mutate({ deckId: d.id, assign: v })} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4" /> {ar ? 'الحدود اليومية' : 'Daily Limits'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>{t(lang, 'dailyTimeLimit')}</Label>
            <div className="flex items-center gap-2">
              <Input type="number" min={5} max={480} value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} />
              <span className="text-sm text-muted-foreground">{ar ? 'دقيقة' : 'min'}</span>
            </div>
          </div>
          <div>
            <Label>{t(lang, 'dailyCardGoal')}</Label>
            <div className="flex items-center gap-2">
              <Input type="number" min={5} max={100} value={cardGoal} onChange={(e) => setCardGoal(Number(e.target.value))} />
              <span className="text-sm text-muted-foreground">{ar ? 'بطاقة' : 'cards'}</span>
            </div>
          </div>
          <Button onClick={() => settingsMut.mutate()} disabled={settingsMut.isPending}>
            {t(lang, 'saveSettings')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-2 p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
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
