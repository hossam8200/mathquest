'use client'

// Parent dashboard: PIN-protected overview of the child's progress.
// Shows: time played, levels completed, accuracy by operation, weak areas,
// deck mastery, weak cards, streaks, assign decks, daily limits.

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
import { ChevronLeft, Lock, Clock, Target, Flame, TrendingDown, BookOpen, Settings } from 'lucide-react'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function ParentDashboardScreen() {
  const lang = useSettingsStore((s) => s.lang)
  const go = useAppStore((s) => s.go)
  const { user } = useCurrentUser()
  const sfx = useSound()
  const { toast } = useToast()
  const qc = useQueryClient()
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
      if (d.ok) {
        sfx('click')
        setUnlocked(true)
      } else {
        sfx('wrong')
        toast({ title: lang === 'ar' ? 'رمز خاطئ' : 'Wrong PIN', variant: 'destructive' })
      }
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
        <Lock className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-4 text-xl font-bold">{t(lang, 'enterPin')}</h2>
        <form
          onSubmit={(e) => { e.preventDefault(); verifyMut.mutate() }}
          className="mt-4 space-y-3"
        >
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
          <Button type="submit" disabled={pin.length !== 4 || verifyMut.isPending} className="w-full">
            {t(lang, 'confirm')}
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
  const { toast } = useToast()
  const qc = useQueryClient()
  const [timeLimit, setTimeLimit] = useState(60)
  const [cardGoal, setCardGoal] = useState(20)

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

  if (isLoading) return <div className="mx-auto max-w-2xl px-4 py-10 text-center text-muted-foreground">Loading…</div>
  if (!data) return null

  const hours = Math.floor(data.timePlayedTodaySec / 3600)
  const mins = Math.floor((data.timePlayedTodaySec % 3600) / 60)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      <Button variant="ghost" size="sm" onClick={() => go({ view: 'home' })} className="mb-3">
        <ChevronLeft className="mr-1 h-4 w-4" /> {t(lang, 'back')}
      </Button>
      <h1 className="mb-6 flex items-center gap-2 text-3xl font-black">
        👨‍👩‍👧 {t(lang, 'parentDashboard')}
      </h1>

      {/* Quick stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-2 p-3">
            <Clock className="h-5 w-5 text-sky-500" />
            <div>
              <div className="text-lg font-black">{hours}h {mins}m</div>
              <div className="text-[10px] text-muted-foreground">{t(lang, 'timePlayed')}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-3">
            <Target className="h-5 w-5 text-emerald-500" />
            <div>
              <div className="text-lg font-black">{data.levelsCompleted}</div>
              <div className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'مستويات' : 'Levels'}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-3">
            <Flame className="h-5 w-5 text-orange-500" />
            <div>
              <div className="text-lg font-black">{data.studyStreak}</div>
              <div className="text-[10px] text-muted-foreground">{t(lang, 'studyStreak')}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-3">
            <BookOpen className="h-5 w-5 text-fuchsia-500" />
            <div>
              <div className="text-lg font-black">{data.deckMastery.filter((d: { masteryPct: number }) => d.masteryPct === 100).length}</div>
              <div className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'مجموعات متقنة' : 'Decks mastered'}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weak areas */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingDown className="h-5 w-5 text-rose-500" />
            {t(lang, 'weakAreas')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.weakAreas.length === 0 ? (
            <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'لا توجد بيانات بعد.' : 'No data yet.'}</p>
          ) : (
            <div className="space-y-2">
              {data.weakAreas.map((w: { operation: string; accuracy: number }) => (
                <div key={w.operation} className="flex items-center justify-between">
                  <span className="font-bold">{w.operation}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={w.accuracy} className="h-2 w-32" />
                    <span className="text-sm font-bold text-rose-500">{w.accuracy}%</span>
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
          <CardTitle className="text-lg">{lang === 'ar' ? 'إتقان المجموعات' : 'Deck mastery'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto scroll-thin">
            {data.deckMastery.map((d: { id: string; title: string; masteryPct: number; cardCount: number }) => (
              <div key={d.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{d.title}</span>
                <div className="flex items-center gap-2">
                  <Progress value={d.masteryPct} className="h-2 w-24" />
                  <span className="text-xs font-bold">{d.masteryPct}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weak cards */}
      {data.weakCards.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">{lang === 'ar' ? 'بطاقات ضعيفة' : 'Weak cards'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {data.weakCards.slice(0, 5).map((c: { front: string; back: string; deckTitle: string }, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-muted px-2 py-1 text-sm">
                  <span className="font-mono font-bold">{c.front} = {c.back}</span>
                  <span className="text-xs text-muted-foreground">{c.deckTitle}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assign decks */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">{t(lang, 'assignDeck')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto scroll-thin">
            {data.allBuiltin.map((d: { id: string; title: string; coverIcon: string; ageBand: string; assigned: boolean }) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border p-2">
                <span className="text-sm">
                  {d.coverIcon} {d.title} <span className="text-xs text-muted-foreground">({d.ageBand})</span>
                </span>
                <Switch
                  checked={d.assigned}
                  onCheckedChange={(v) => assignMut.mutate({ deckId: d.id, assign: v })}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" /> {t(lang, 'saveSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>{t(lang, 'dailyTimeLimit')}</Label>
            <div className="flex items-center gap-2">
              <Input type="number" min={5} max={480} value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} />
              <span className="text-sm text-muted-foreground">{lang === 'ar' ? 'دقيقة' : 'min'}</span>
            </div>
          </div>
          <div>
            <Label>{t(lang, 'dailyCardGoal')}</Label>
            <div className="flex items-center gap-2">
              <Input type="number" min={5} max={100} value={cardGoal} onChange={(e) => setCardGoal(Number(e.target.value))} />
              <span className="text-sm text-muted-foreground">{lang === 'ar' ? 'بطاقة' : 'cards'}</span>
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
