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
// 9. "How We Teach This" micro-guides (expandable teaching tips)
// 10. Parent-Requested Quests (assign practice → child gets notification + reward)
// 11. Teacher Report (printable one-page anonymized PDF)
// 12. Family Goals (set goals + real-world reward suggestions)
// 13. Privacy badge + Download My Data + Reset All Progress

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
import { ChevronLeft, ChevronDown, ChevronUp, Lock, Clock, Target, Flame, TrendingDown, BookOpen, Settings, Star, Trophy, Zap, Calendar, Lightbulb, Gift, CheckCircle2, Shield, Download, Trash2, FileText, Swords } from 'lucide-react'
import { t } from '@/lib/i18n'
import { kidAvatar } from '@/lib/dicebear'
import { cn } from '@/lib/utils'

// Teaching tips — "How MathQuest teaches this" micro-guides for parents
const TEACHING_TIPS: Record<string, { title: string; tip: string; homeActivity: string }> = {
  addition: {
    title: 'How MathQuest teaches addition',
    tip: 'We use number bonds and partitioning. For 7+8, think 7+3=10, then 10+5=15.',
    homeActivity: "Try at home: 'How many different ways can you make 15?'",
  },
  subtraction: {
    title: 'How MathQuest teaches subtraction',
    tip: 'We use counting back and number lines. For 15-8, start at 15 and count back 8 steps.',
    homeActivity: "Try at home: 'If you have 15 cookies and eat 8, how many are left?'",
  },
  multiplication: {
    title: 'How MathQuest teaches multiplication',
    tip: 'We break into parts. For 7×8, think (7×5)+(7×3)=35+21=56. This is called partial products.',
    homeActivity: "Try at home: 'What's 7 fives? Now add 3 more sevens!'",
  },
  division: {
    title: 'How MathQuest teaches division',
    tip: 'We think of groups. For 56÷7, ask "How many groups of 7 fit in 56?"',
    homeActivity: "Try at home: 'Share 56 candies equally among 7 friends. How many each?'",
  },
}

const GOAL_TYPES = [
  { type: 'days', label: 'Play 3 days this week', target: 3, icon: '📅' },
  { type: 'levels', label: 'Complete 5 new levels', target: 5, icon: '🎯' },
  { type: 'stars', label: 'Earn 10 new stars', target: 10, icon: '⭐' },
  { type: 'boss', label: 'Defeat a Boss level', target: 1, icon: '👑' },
]

const REAL_WORLD_REWARDS = [
  'Let them pick the Friday night movie 🎬',
  'A favorite snack or treat 🍦',
  '30 extra minutes of screen time ⏰',
  'Choose what\'s for dinner one night 🍕',
  'A trip to the park or playground 🏞️',
]

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
  const sfx = useSound()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [timeLimit, setTimeLimit] = useState(60)
  const [cardGoal, setCardGoal] = useState(20)
  const [encourageMsg, setEncourageMsg] = useState('')
  const [encourageCoins, setEncourageCoins] = useState(20)
  const [expandedTip, setExpandedTip] = useState<string | null>(null)
  const [showTeacherReport, setShowTeacherReport] = useState(false)
  const [selectedGoalType, setSelectedGoalType] = useState('days')

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

  // Parent quest — assign a practice quest to the child
  const questMut = useMutation({
    mutationFn: async (payload: { operation: string; target: number; rewardCoins: number }) => {
      const r = await fetch('/api/parent/quests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      return r.json()
    },
    onSuccess: () => {
      sfx('levelup')
      toast({ title: `🛡️ Quest assigned! ${data?.childName} will see it on next login.` })
    },
  })

  // Family goal — set a co-op goal
  const goalMut = useMutation({
    mutationFn: async (goalType: string) => {
      const goal = GOAL_TYPES.find(g => g.type === goalType)!
      const reward = REAL_WORLD_REWARDS[Math.floor(Math.random() * REAL_WORLD_REWARDS.length)]
      const r = await fetch('/api/parent/family-goal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: goal.type, target: goal.target, reward }),
      })
      return r.json()
    },
    onSuccess: (d) => {
      toast({ title: '🎯 Family goal set!', description: d.goal?.reward })
    },
  })

  // Download data
  const downloadMut = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/parent/download-data')
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mathquest-data-${data?.childName}.json`
      a.click()
      URL.revokeObjectURL(url)
    },
    onSuccess: () => toast({ title: '📥 Data downloaded!' }),
  })

  // Reset progress
  const resetMut = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/parent/reset-progress', { method: 'POST' })
      return r.json()
    },
    onSuccess: () => {
      toast({ title: '✅ All progress has been reset.' })
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
        <img src={kidAvatar(data.childName, 56)} alt={data.childName} width={56} height={56} className="rounded-full ring-2 ring-primary/30" loading="lazy" />
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

      {/* Weak areas + teaching tips + parent quests */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingDown className="h-4 w-4 text-rose-500" />
            {t(lang, 'weakAreas')} · {ar ? 'كيف نساعد' : 'How to Help'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.weakAreas.length === 0 ? (
            <p className="text-sm text-muted-foreground">{ar ? 'لا توجد بيانات بعد.' : 'No data yet.'}</p>
          ) : (
            <div className="space-y-3">
              {data.weakAreas.map((w: { operation: string; accuracy: number }) => {
                const tip = TEACHING_TIPS[w.operation]
                const expanded = expandedTip === w.operation
                return (
                  <div key={w.operation} className="rounded-xl border p-3">
                    {/* Operation + accuracy bar */}
                    <div className="flex items-center justify-between">
                      <span className="font-bold capitalize">{w.operation}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={w.accuracy} className={cn('h-2 w-24', w.accuracy < 50 && '[&>*]:bg-rose-500')} />
                        <span className={cn('text-sm font-bold', w.accuracy < 50 ? 'text-rose-500' : 'text-emerald-500')}>{w.accuracy}%</span>
                      </div>
                    </div>
                    {/* Actions: teaching tip + assign quest */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {tip && (
                        <button
                          onClick={() => setExpandedTip(expanded ? null : w.operation)}
                          className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold text-primary hover:bg-primary/5"
                        >
                          <BookOpen className="h-3 w-3" />
                          {ar ? 'كيف نُعلّم هذا' : 'How we teach this'}
                          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      )}
                      <button
                        onClick={() => questMut.mutate({ operation: w.operation as any, target: 3, rewardCoins: 50 })}
                        disabled={questMut.isPending}
                        className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                      >
                        <Swords className="h-3 w-3" />
                        {ar ? 'إرسل مهمة!' : 'Assign Quest!'}
                      </button>
                    </div>
                    {/* Expandable teaching tip */}
                    {expanded && tip && (
                      <div className="mt-2 rounded-lg bg-muted p-2 text-xs mq-pop">
                        <div className="font-bold text-primary">💡 {tip.title}</div>
                        <p className="mt-1 text-muted-foreground">{tip.tip}</p>
                        <p className="mt-1 font-medium">{tip.homeActivity}</p>
                      </div>
                    )}
                  </div>
                )
              })}
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

      {/* ─── Family Goals (Co-Op) ─── */}
      <Card className="mb-4 border-2 border-fuchsia-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-fuchsia-600">
            <Target className="h-4 w-4" />
            {ar ? 'هدف عائلي' : 'Family Goal'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {ar ? 'اضبط هدفاً — عند تحقيقه، اقترح مكافأة واقعية!' : 'Set a goal — when achieved, suggest a real-world reward!'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {GOAL_TYPES.map(g => (
              <button
                key={g.type}
                onClick={() => { sfx('click'); setSelectedGoalType(g.type) }}
                className={cn(
                  'flex items-center gap-2 rounded-xl border-2 p-2 text-left text-sm transition',
                  selectedGoalType === g.type ? 'border-fuchsia-400 bg-fuchsia/5' : 'border-border hover:border-fuchsia-300'
                )}
              >
                <span className="text-xl">{g.icon}</span>
                <span className="font-bold">{g.label}</span>
              </button>
            ))}
          </div>
          <Button className="w-full" variant="outline" onClick={() => goalMut.mutate(selectedGoalType)} disabled={goalMut.isPending}>
            <Target className="mr-1 h-4 w-4" /> {ar ? 'اضبط الهدف' : 'Set Goal'}
          </Button>
        </CardContent>
      </Card>

      {/* ─── Teacher Report ─── */}
      <Card className="mb-4 border-2 border-sky-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-sky-600">
            <FileText className="h-4 w-4" />
            {ar ? 'تقرير للمعلم' : 'Teacher Report'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-xs text-muted-foreground">
            {ar ? 'أنشئ تقريراً مجهول الهوية من صفحة واحدة — آمن للمشاركة مع المدرسة' : 'Generate a clean, anonymized one-page report — safe to share with school'}
          </p>
          <Button variant="outline" className="w-full" onClick={() => setShowTeacherReport(true)}>
            <FileText className="mr-1 h-4 w-4" /> {ar ? 'إنشاء التقرير' : 'Generate Report'}
          </Button>
        </CardContent>
      </Card>

      {/* ─── Privacy & Data Controls ─── */}
      <Card className="mb-4 border-2 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-emerald-600">
            <Shield className="h-4 w-4" />
            {ar ? 'الخصوصية والبيانات' : 'Privacy & Data'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-emerald-50 p-3 text-xs dark:bg-emerald-950/20">
            <div className="flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300">
              <Shield className="h-3 w-3" /> {ar ? 'الخصوصية أولاً' : 'Privacy First'}
            </div>
            <p className="mt-1 text-muted-foreground">
              {ar
                ? 'هذه اللوحة لا تستخدم كوكيز تتبع، لا تبيع بيانات، وتخزن التقدم المرتبط بالاسم المستعار فقط.'
                : 'This dashboard uses no tracking cookies, sells no data, and only stores progress linked to this nickname.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => downloadMut.mutate()} disabled={downloadMut.isPending}>
              <Download className="mr-1 h-4 w-4" /> {ar ? 'تحميل بياناتي' : 'Download My Data'}
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-rose-600 hover:bg-rose-50" onClick={() => {
              if (confirm(ar ? 'سيتم حذف كل التقدم نهائياً. هل أنت متأكد؟' : 'This will permanently delete ALL progress. Are you sure?')) {
                resetMut.mutate()
              }
            }} disabled={resetMut.isPending}>
              <Trash2 className="mr-1 h-4 w-4" /> {ar ? 'إعادة تعيين' : 'Reset All'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Teacher Report Dialog ─── */}
      {showTeacherReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowTeacherReport(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-4xl">🦊</div>
              <h2 className="mt-2 text-2xl font-black text-orange-600">MathQuest Progress Report</h2>
              <p className="text-xs text-muted-foreground">Anonymized — safe to share with teachers</p>
            </div>
            <div className="mt-6 space-y-4 text-sm">
              <div className="border-b pb-2">
                <span className="font-bold">Student:</span> {data.childName} (nickname only — no real name)
              </div>
              <div className="border-b pb-2">
                <span className="font-bold">Age Group:</span> {data.ageBand}
              </div>
              <div className="border-b pb-2">
                <span className="font-bold">Levels Completed:</span> {data.levelsCompleted}
              </div>
              <div className="border-b pb-2">
                <span className="font-bold">Total Stars Earned:</span> {data.totalStars} ⭐
              </div>
              <div className="border-b pb-2">
                <span className="font-bold">Study Streak:</span> {data.studyStreak} days (longest: {data.longestStudyStreak})
              </div>
              <div className="border-b pb-2">
                <span className="font-bold">Accuracy by Operation:</span>
                <ul className="mt-1 ml-4 list-disc">
                  {Object.entries(data.accuracyByOp).map(([op, acc]) => (
                    <li key={op} className="capitalize">{op}: {acc}%</li>
                  ))}
                </ul>
              </div>
              <div className="border-b pb-2">
                <span className="font-bold">Focus Areas:</span>
                <ul className="mt-1 ml-4 list-disc">
                  {data.weakAreas.map((w: any) => (
                    <li key={w.operation} className="capitalize">{w.operation} ({w.accuracy}% — needs practice)</li>
                  ))}
                  {data.weakAreas.length === 0 && <li>All operations at acceptable levels</li>}
                </ul>
              </div>
              <div className="border-b pb-2">
                <span className="font-bold">Badges Earned:</span> {data.weekBadges.length} this week
              </div>
              <div className="rounded-lg bg-amber-50 p-2 text-xs text-muted-foreground">
                🔒 This report contains no personal data. The nickname is chosen by the child and is not linked to any real identity.
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button className="flex-1" onClick={() => window.print()}>
                <FileText className="mr-1 h-4 w-4" /> Print / Save PDF
              </Button>
              <Button variant="outline" onClick={() => setShowTeacherReport(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
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
