'use client'

// Daily challenge screen: shows today's challenge, progress, and a claim button.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSettingsStore } from '@/store/settings-store'
import { useAppStore } from '@/store/app-store'
import { useSound } from '@/hooks/use-sound'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Coins, Check, Trophy, CalendarHeart } from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_LABEL: Record<string, { en: string; ar: string; emoji: string }> = {
  levels: { en: 'Complete 3 levels', ar: 'أكمل 3 مستويات', emoji: '🗺️' },
  points: { en: 'Earn 150 points', ar: 'اكسب 150 نقطة', emoji: '⚡' },
  cards:  { en: 'Review 20 flashcards', ar: 'راجع 20 بطاقة', emoji: '🃏' },
  match:  { en: 'Win 2 Match games', ar: 'افز في لعبتين', emoji: '🎮' },
}

export function DailyChallengeScreen() {
  const lang = useSettingsStore((s) => s.lang)
  const go = useAppStore((s) => s.go)
  const sfx = useSound()
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['daily'],
    queryFn: async () => {
      const r = await fetch('/api/progress/daily', { cache: 'no-store' })
      if (!r.ok) throw new Error()
      return r.json()
    },
  })

  const claimMut = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/progress/daily/claim', { method: 'POST' })
      return r.json()
    },
    onSuccess: (d) => {
      if (d.ok) {
        sfx('coin')
        toast({ title: lang === 'ar' ? `+${d.rewardCoins} عملات!` : `+${d.rewardCoins} coins!` })
        qc.invalidateQueries({ queryKey: ['daily'] })
        qc.invalidateQueries({ queryKey: ['me'] })
      } else {
        toast({ title: lang === 'ar' ? 'لا يمكن الاستلام بعد' : 'Not claimable yet', variant: 'destructive' })
      }
    },
  })

  if (isLoading) {
    return <div className="mx-auto max-w-md px-4 py-10 text-center text-muted-foreground">Loading…</div>
  }
  if (!data) return null

  const c = data.challenge
  const p = data.progress
  const pct = c.target > 0 ? Math.min(100, (p.progress / c.target) * 100) : 0
  const label = TYPE_LABEL[c.type] ?? TYPE_LABEL.levels

  return (
    <div className="mx-auto max-w-md px-4 py-6 md:py-10">
      <h1 className="mb-6 flex items-center gap-2 text-3xl font-black">
        <CalendarHeart className="h-8 w-8 text-rose-500" />
        {lang === 'ar' ? 'التحدي اليومي' : 'Daily Challenge'}
      </h1>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-amber-400 via-rose-400 to-fuchsia-400 p-5 text-white">
          <div className="flex items-center gap-3">
            <span className="text-5xl">{label.emoji}</span>
            <div>
              <h2 className="text-xl font-black">{lang === 'ar' ? label.ar : label.en}</h2>
              <p className="text-sm text-white/90">
                {lang === 'ar' ? 'المكافأة:' : 'Reward:'} {c.rewardCoins} {lang === 'ar' ? 'عملة' : 'coins'}
              </p>
            </div>
          </div>
        </div>
        <CardContent className="p-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-bold">{p.progress} / {c.target}</span>
            <span className="text-muted-foreground">{Math.round(pct)}%</span>
          </div>
          <Progress value={pct} className="mb-4 h-3" />

          {p.claimed ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-100 p-3 font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              <Check className="h-5 w-5" />
              {lang === 'ar' ? 'تم الاستلام!' : 'Claimed!'}
            </div>
          ) : p.completed ? (
            <Button className="w-full" onClick={() => claimMut.mutate()} disabled={claimMut.isPending}>
              <Coins className="mr-1 h-5 w-5" />
              {lang === 'ar' ? `استلم ${c.rewardCoins} عملة` : `Claim ${c.rewardCoins} coins`}
            </Button>
          ) : (
            <div className="rounded-xl bg-muted p-3 text-center text-sm text-muted-foreground">
              {lang === 'ar' ? 'أكمل التحدي للاستلام' : 'Complete the challenge to claim'}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-amber-500" />
            {lang === 'ar' ? 'كيف أكمل التحدي؟' : 'How to complete'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <Button variant="outline" className="w-full justify-start" onClick={() => go({ view: 'worlds' })}>
            🗺️ {lang === 'ar' ? 'العب مستويات' : 'Play levels'}
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => go({ view: 'decks' })}>
            🃏 {lang === 'ar' ? 'راجع البطاقات' : 'Review flashcards'}
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => go({ view: 'marketplace' })}>
            🛒 {lang === 'ar' ? 'تسوق شخصيات' : 'Shop characters'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
