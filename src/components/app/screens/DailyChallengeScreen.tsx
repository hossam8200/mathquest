'use client'

// Daily challenge screen — now shows multiple simultaneous challenges.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSettingsStore } from '@/store/settings-store'
import { useAppStore } from '@/store/app-store'
import { useSound } from '@/hooks/use-sound'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Coins, Check, Gift, BookOpen, Gamepad2, Map as MapIcon } from 'lucide-react'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function DailyChallengeScreen() {
  const lang = useSettingsStore((s) => s.lang)
  const go = useAppStore((s) => s.go)
  const sfx = useSound()
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['daily-multi'],
    queryFn: async () => {
      const r = await fetch('/api/progress/daily', { cache: 'no-store' })
      if (!r.ok) throw new Error()
      return r.json()
    },
  })

  const claimMut = useMutation({
    mutationFn: async (type: string) => {
      const r = await fetch('/api/progress/daily/claim', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      return r.json()
    },
    onSuccess: (d) => {
      if (d.ok) {
        sfx('coin')
        toast({ title: `+${d.rewardCoins} coins!` })
        qc.invalidateQueries({ queryKey: ['daily-multi'] })
        qc.invalidateQueries({ queryKey: ['me'] })
      } else {
        toast({ title: lang === 'ar' ? 'لا يمكن الاستلام بعد' : 'Not claimable yet', variant: 'destructive' })
      }
    },
  })

  if (isLoading) {
    return <div className="mx-auto max-w-md px-4 py-10 text-center text-muted-foreground">Loading…</div>
  }

  const challenges = data?.challenges ?? []

  return (
    <div className="mx-auto max-w-md px-4 py-6 md:py-10">
      <h1 className="mb-6 flex items-center gap-2 text-3xl font-black">
        🎯 {lang === 'ar' ? 'تحديات اليوم' : 'Daily Challenges'}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {lang === 'ar' ? 'اكمل التحديات لكسب عملات إضافية كل يوم!' : 'Complete challenges to earn bonus coins every day!'}
      </p>

      <div className="space-y-4">
        {challenges.map((ch: any) => {
          const pct = ch.target > 0 ? Math.min(100, (ch.progress / ch.target) * 100) : 0
          return (
            <Card key={ch.type} className={cn(ch.completed && !ch.claimed && 'border-2 border-amber-400')}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="text-2xl">{ch.emoji}</span>
                    {ch.name}
                  </CardTitle>
                  <span className="flex items-center gap-1 text-sm font-bold text-yellow-600">
                    <Coins className="h-4 w-4" /> {ch.rewardCoins}
                  </span>
                </div>
                <CardDescription>{ch.desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-bold">{ch.progress} / {ch.target}</span>
                    <span className="text-muted-foreground">{Math.round(pct)}%</span>
                  </div>
                  <Progress value={pct} className="h-3" />
                </div>
                {ch.claimed ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-100 p-3 font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <Check className="h-5 w-5" />
                    {lang === 'ar' ? 'تم الاستلام!' : 'Claimed!'}
                  </div>
                ) : ch.completed ? (
                  <Button className="w-full" onClick={() => claimMut.mutate(ch.type)} disabled={claimMut.isPending}>
                    <Gift className="mr-1 h-5 w-5" />
                    {lang === 'ar' ? `استلم ${ch.rewardCoins} عملة` : `Claim ${ch.rewardCoins} coins`}
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => {
                    if (ch.type === 'cards') go({ view: 'decks' })
                    else if (ch.type === 'levels') go({ view: 'worlds' })
                    else go({ view: 'worlds' })
                  }}>
                    {ch.type === 'cards' ? <><BookOpen className="mr-1 h-4 w-4" /> {t(lang, 'learn')}</> :
                     ch.type === 'levels' ? <><MapIcon className="mr-1 h-4 w-4" /> {t(lang, 'play')}</> :
                     <><Gamepad2 className="mr-1 h-4 w-4" /> {t(lang, 'play')}</>}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">💡 {lang === 'ar' ? 'كيف تعمل التحديات؟' : 'How challenges work'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• {lang === 'ar' ? 'تُحدث التحديات كل يوم في منتصف الليل' : 'Challenges reset at midnight every day'}</p>
          <p>• {lang === 'ar' ? 'يمكنك إكمال جميع التحديات الثلاثة لكسب 120 عملة إضافية يومياً' : 'Complete all 3 challenges to earn 120 bonus coins daily'}</p>
          <p>• {lang === 'ar' ? 'استلم مكافأتك فور إكمال التحدي' : 'Claim your reward as soon as you complete a challenge'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
