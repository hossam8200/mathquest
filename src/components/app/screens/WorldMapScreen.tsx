'use client'

// World map: shows the 5 worlds. Clicking one opens its level grid.
// Levels show lock state + stars earned. Clicking an unlocked level opens
// the PreGameModal where the player picks MCQ vs typed + timer.

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { useSettingsStore } from '@/store/settings-store'
import { useSound } from '@/hooks/use-sound'
import { useToast } from '@/hooks/use-toast'
import { t } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Lock, Star, Crown, ChevronLeft } from 'lucide-react'
import type { WorldInfo, LevelInfo } from '@/types'
import { PreGameModal } from '../gameplay/PreGameModal'
import { cn } from '@/lib/utils'

interface WorldSummary extends WorldInfo {
  totalLevels: number
  completedLevels: number
  bestStarsSum: number
}

const WORLD_GRADIENTS: Record<string, string> = {
  addition: 'from-rose-400 to-orange-400',
  subtraction: 'from-emerald-400 to-teal-500',
  multiplication: 'from-amber-400 to-yellow-500',
  division: 'from-fuchsia-400 to-purple-500',
  mixed: 'from-sky-400 to-cyan-500',
}

export function WorldMapScreen() {
  const lang = useSettingsStore((s) => s.lang)
  const go = useAppStore((s) => s.go)
  const sfx = useSound()
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<LevelInfo | null>(null)

  const worldsQ = useQuery<{ worlds: WorldSummary[] }>({
    queryKey: ['worlds'],
    queryFn: async () => {
      const r = await fetch('/api/gameplay/worlds', { cache: 'no-store' })
      if (!r.ok) throw new Error('Failed to load worlds')
      return r.json()
    },
  })

  const levelsQ = useQuery<{ levels: LevelInfo[] }>({
    queryKey: ['levels', selectedWorldId],
    queryFn: async () => {
      const r = await fetch(`/api/gameplay/levels?worldId=${selectedWorldId}`, { cache: 'no-store' })
      if (!r.ok) throw new Error('Failed to load levels')
      return r.json()
    },
    enabled: !!selectedWorldId,
  })

  if (!selectedWorldId) {
    // World picker
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <Button variant="ghost" size="sm" onClick={() => go({ view: 'home' })} className="mb-3">
          <ChevronLeft className="mr-1 h-4 w-4" /> {t(lang, 'back')}
        </Button>
        <h1 className="mb-1 text-3xl font-black">{t(lang, 'worlds')}</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {lang === 'ar' ? 'اختر عالماً وابدأ المغامرة!' : 'Pick a world and start your adventure!'}
        </p>

        {worldsQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {worldsQ.isError && <p className="text-sm text-destructive">Failed to load worlds.</p>}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {worldsQ.data?.worlds.map((w) => {
            const pct = w.totalLevels > 0 ? (w.completedLevels / w.totalLevels) * 100 : 0
            return (
              <button
                key={w.id}
                onClick={() => { sfx('click'); setSelectedWorldId(w.id) }}
                className="group overflow-hidden rounded-2xl text-left shadow-md transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={cn('relative bg-gradient-to-br p-5 text-white', WORLD_GRADIENTS[w.key])}>
                  <div className="text-5xl mq-float">{w.emoji}</div>
                  <h3 className="mt-2 text-xl font-black">{w.name}</h3>
                  <p className="text-xs text-white/90">
                    {w.completedLevels}/{w.totalLevels} {t(lang, 'unlocked').toLowerCase()}
                  </p>
                  <div className="mt-1 text-xs text-white/90">
                    ⭐ {w.bestStarsSum}
                  </div>
                </div>
                <div className="bg-card p-3">
                  <Progress value={pct} className="h-2" />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Level grid for the selected world
  const world = worldsQ.data?.worlds.find((w) => w.id === selectedWorldId)
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => { sfx('click'); setSelectedWorldId(null) }}
        className="mb-3"
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> {lang === 'ar' ? 'كل العوالم' : 'All worlds'}
      </Button>

      <div className="mb-6 flex items-center gap-3">
        <span className="text-4xl">{world?.emoji}</span>
        <div>
          <h1 className="text-2xl font-black md:text-3xl">{world?.name}</h1>
          <p className="text-xs text-muted-foreground">
            {world?.completedLevels}/{world?.totalLevels} {t(lang, 'unlocked').toLowerCase()}
          </p>
        </div>
      </div>

      {levelsQ.isLoading && <p className="text-sm text-muted-foreground">Loading levels…</p>}
      {levelsQ.isError && <p className="text-sm text-destructive">Failed to load levels.</p>}

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-6">
        {levelsQ.data?.levels.map((l) => (
          <LevelDot
            key={l.id}
            level={l}
            onClick={() => {
              if (!l.unlocked) { sfx('wrong'); return }
              sfx('click')
              setSelectedLevel(l)
            }}
          />
        ))}
      </div>

      <PreGameModal
        level={selectedLevel}
        worldName={world?.name ?? ''}
        worldEmoji={world?.emoji ?? ''}
        onClose={() => setSelectedLevel(null)}
      />
    </div>
  )
}

function LevelDot({ level, onClick }: { level: LevelInfo; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!level.unlocked}
      className={cn(
        'mq-level-dot relative flex aspect-square flex-col items-center justify-center rounded-xl border-2 p-1 text-center transition',
        level.unlocked
          ? level.isBoss
            ? 'border-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30'
            : 'border-primary/40 bg-card hover:border-primary hover:bg-primary/5'
          : 'border-muted bg-muted/40 opacity-60',
        !level.unlocked && 'cursor-not-allowed'
      )}
      aria-label={`${t(useSettingsStore.getState().lang, 'level') || 'Level'} ${level.levelNumber}`}
    >
      {level.isBoss && level.unlocked && (
        <Crown className="absolute right-1 top-1 h-3 w-3 text-amber-500" />
      )}
      {level.unlocked ? (
        <>
          <span className="text-lg font-black">{level.levelNumber}</span>
          {level.isBoss && <span className="text-[10px] font-bold text-amber-600">BOSS</span>}
          <div className="mt-0.5 flex gap-0.5">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={cn(
                  'h-2.5 w-2.5',
                  (level.bestStars ?? 0) >= s ? 'fill-amber-400 text-amber-400' : 'fill-none text-muted-foreground'
                )}
              />
            ))}
          </div>
        </>
      ) : (
        <Lock className="h-5 w-5 text-muted-foreground" />
      )}
    </button>
  )
}
