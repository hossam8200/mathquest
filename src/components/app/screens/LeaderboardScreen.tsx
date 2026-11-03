'use client'

// Leaderboard: global + weekly rankings.

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSettingsStore } from '@/store/settings-store'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, Trophy, Crown, Medal } from 'lucide-react'
import { t } from '@/lib/i18n'
import { kidAvatar } from '@/lib/dicebear'
import type { LeaderboardRow } from '@/types'
import { cn } from '@/lib/utils'

export function LeaderboardScreen() {
  const lang = useSettingsStore((s) => s.lang)
  const go = useAppStore((s) => s.go)

  const { data, isLoading } = useQuery<{ global: LeaderboardRow[]; weekly: LeaderboardRow[] }>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const r = await fetch('/api/progress/leaderboard', { cache: 'no-store' })
      if (!r.ok) throw new Error()
      return r.json()
    },
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-10">
      <Button variant="ghost" size="sm" onClick={() => go({ view: 'home' })} className="mb-3">
        <ChevronLeft className="mr-1 h-4 w-4" /> {t(lang, 'back')}
      </Button>
      <h1 className="mb-6 flex items-center gap-2 text-3xl font-black">
        <Trophy className="h-8 w-8 text-amber-500" />
        {t(lang, 'leaderboard')}
      </h1>

      <Tabs defaultValue="global">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="global">{lang === 'ar' ? 'عالمي' : 'Global'}</TabsTrigger>
          <TabsTrigger value="weekly">{lang === 'ar' ? 'أسبوعي' : 'Weekly'}</TabsTrigger>
        </TabsList>
        <TabsContent value="global" className="mt-4">
          {isLoading ? <p className="text-muted-foreground">Loading…</p> : <Rows rows={data?.global ?? []} lang={lang} />}
        </TabsContent>
        <TabsContent value="weekly" className="mt-4">
          {isLoading ? <p className="text-muted-foreground">Loading…</p> : <Rows rows={data?.weekly ?? []} lang={lang} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Rows({ rows, lang }: { rows: LeaderboardRow[]; lang: 'en' | 'ar' }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'لا توجد نتائج بعد.' : 'No entries yet.'}</p>
  }
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <Card key={r.nickname} className={cn(r.isCurrentUser && 'border-2 border-primary')}>
          <CardContent className="flex items-center gap-3 p-3">
            <div className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-black text-sm',
              r.rank === 1 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' :
              r.rank === 2 ? 'bg-slate-200 text-slate-600 dark:bg-slate-700' :
              r.rank === 3 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30' :
              'bg-muted text-muted-foreground'
            )}>
              {r.rank <= 3 ? <Crown className="h-5 w-5" /> : r.rank}
            </div>
            <div className="text-2xl">
              <img src={kidAvatar(r.nickname, 40)} alt={r.nickname} width={40} height={40} className="rounded-full" loading="lazy" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">
                {r.nickname}
                {r.isCurrentUser && <span className="ml-1 text-xs text-primary">({lang === 'ar' ? 'أنت' : 'you'})</span>}
              </div>
              <div className="text-xs text-muted-foreground">
                {r.totalPoints} {t(lang, 'points')}
              </div>
            </div>
            {r.rank <= 3 && <Medal className={cn('h-5 w-5', r.rank === 1 ? 'text-amber-500' : r.rank === 2 ? 'text-slate-400' : 'text-orange-500')} />}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
