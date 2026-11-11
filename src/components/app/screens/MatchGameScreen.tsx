'use client'

// Match game: timed pairing of problems (left) with answers (right).
// Tap a problem, then tap its matching answer. 6/8/12 pairs based on level.
// Score = base - time penalty - mistake penalty.

import { useEffect, useState, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { useSettingsStore } from '@/store/settings-store'
import { useSound } from '@/hooks/use-sound'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, RotateCcw, Trophy } from 'lucide-react'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { CardInfo } from '@/types'

interface Pair {
  card: CardInfo
  matched: boolean
}

interface Side {
  id: string
  text: string
  pairIdx: number
  matched: boolean
  flipped: boolean
}

const PAIRS_BY_LEVEL: Record<number, number> = { 1: 6, 2: 8, 3: 12 }

export function MatchGameScreen() {
  const lang = useSettingsStore((s) => s.lang)
  const go = useAppStore((s) => s.go)
  const deckId = useAppStore((s) => s.selectedDeckId)
  const sfx = useSound()
  const { toast } = useToast()
  const qc = useQueryClient()

  const [loading, setLoading] = useState(true)
  const [pairs, setPairs] = useState<Pair[]>([])
  const [leftItems, setLeftItems] = useState<Side[]>([])
  const [rightItems, setRightItems] = useState<Side[]>([])
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null)
  const [selectedRight, setSelectedRight] = useState<number | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [done, setDone] = useState(false)
  const [result, setResult] = useState<{ score: number; points: number; coins: number; timeSec: number } | null>(null)
  const [level, setLevel] = useState(1)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    if (!deckId) return
    setLoading(true)
    setDone(false)
    setResult(null)
    setMistakes(0)
    setSelectedLeft(null)
    setSelectedRight(null)
    // Fetch all cards for the deck, pick N
    const r = await fetch(`/api/decks/${deckId}`, { cache: 'no-store' })
    const data = await r.json()
    const allCards: CardInfo[] = data.cards
    if (allCards.length === 0) {
      setLoading(false)
      return
    }
    const n = Math.min(PAIRS_BY_LEVEL[level] ?? 6, allCards.length)
    const shuffled = [...allCards].sort(() => Math.random() - 0.5).slice(0, n)
    const newPairs: Pair[] = shuffled.map((c) => ({ card: c, matched: false }))
    setPairs(newPairs)
    // Left = problems (front), right = answers (back), both shuffled
    const left: Side[] = shuffled
      .map((c, i) => ({ id: `L${i}`, text: c.front, pairIdx: i, matched: false, flipped: true }))
      .sort(() => Math.random() - 0.5)
    const right: Side[] = shuffled
      .map((c, i) => ({ id: `R${i}`, text: c.back, pairIdx: i, matched: false, flipped: true }))
      .sort(() => Math.random() - 0.5)
    setLeftItems(left)
    setRightItems(right)
    setStartTime(Date.now())
    setLoading(false)
  }, [deckId, level])

  // load() runs an async data fetch; setLoading(true) at its start is standard.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  // Timer — updates elapsed display via setInterval.
  useEffect(() => {
    if (loading || done) return
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [loading, done, startTime])

  // Handle a tap on a right-side item. If a left item is already selected,
  // check for match immediately (in the event handler, not an effect).
  function tapRight(i: number) {
    const rItem = rightItems[i]
    if (!rItem || rItem.matched) return
    if (selectedLeft === null) {
      setSelectedRight(i)
      return
    }
    const lItem = leftItems.find((_, idx) => idx === selectedLeft)
    if (!lItem) { setSelectedRight(i); return }
    if (lItem.pairIdx === rItem.pairIdx) {
      sfx('match')
      const newPairs = pairs.map((p, idx) => idx === lItem.pairIdx ? { ...p, matched: true } : p)
      setPairs(newPairs)
      setLeftItems((items) => items.map((it, idx) => idx === selectedLeft ? { ...it, matched: true } : it))
      setRightItems((items) => items.map((it, idx) => idx === i ? { ...it, matched: true } : it))
      setSelectedLeft(null)
      setSelectedRight(null)
      // Check completion
      if (newPairs.every((p) => p.matched)) {
        finishRef.current()
      }
    } else {
      sfx('wrong')
      setMistakes((m) => m + 1)
      setSelectedRight(i)
      setTimeout(() => {
        setSelectedLeft(null)
        setSelectedRight(null)
      }, 600)
    }
  }

  function tapLeft(i: number) {
    const lItem = leftItems[i]
    if (!lItem || lItem.matched) return
    setSelectedLeft(i)
  }

  // Finish the round — stored in a ref so tapRight can call it without it being
  // a dependency of the render.
  const finishRef = useRef<() => void>(() => {})
  const finish = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    const timeSec = Math.floor((Date.now() - startTime) / 1000)
    const n = pairs.length
    try {
      const r = await fetch('/api/decks/match-score', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId, timeSec, mistakes, pairs: n }),
      })
      const data = await r.json()
      sfx('levelup')
      setResult({ score: data.score, points: data.points, coins: data.coins, timeSec })
      setDone(true)
      if (data.coins > 0) toast({ title: `+${data.coins} coins!` })
      // Invalidate caches so everything updates
      qc.invalidateQueries({ queryKey: ['decks'] })
      qc.invalidateQueries({ queryKey: ['daily-multi'] })
      qc.invalidateQueries({ queryKey: ['me'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    } catch {
      setDone(true)
    }
  }, [startTime, pairs.length, mistakes, deckId, sfx, toast, qc])
  useEffect(() => { finishRef.current = finish }, [finish])

  function nextLevel() {
    setLevel((l) => Math.min(3, l + 1))
  }

  if (!deckId) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <p className="text-muted-foreground">{lang === 'ar' ? 'لا توجد مجموعة مختارة.' : 'No deck selected.'}</p>
        <Button className="mt-4" onClick={() => go({ view: 'decks' })}>{t(lang, 'decksTitle')}</Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <div className="text-6xl mq-bounce">🃏</div>
        <p className="mt-4 text-muted-foreground">{lang === 'ar' ? 'جاري التحميل…' : 'Loading…'}</p>
      </div>
    )
  }

  if (pairs.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <p className="text-muted-foreground">{lang === 'ar' ? 'لا توجد بطاقات في هذه المجموعة.' : 'This deck has no cards.'}</p>
        <Button className="mt-4" onClick={() => go({ view: 'decks' })}>{t(lang, 'back')}</Button>
      </div>
    )
  }

  if (done && result) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <div className="text-6xl mq-celebrate">🎉</div>
        <h2 className="mt-4 text-2xl font-black">{lang === 'ar' ? 'أحسنت!' : 'Match complete!'}</h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-muted p-3">
            <div className="text-xl font-black">{result.timeSec}s</div>
            <div className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'الوقت' : 'Time'}</div>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <div className="text-xl font-black text-rose-500">{mistakes}</div>
            <div className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'أخطاء' : 'Mistakes'}</div>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <div className="text-xl font-black text-amber-500">{result.coins}</div>
            <div className="text-[10px] text-muted-foreground">{t(lang, 'coins')}</div>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" onClick={() => go({ view: 'decks' })}>{t(lang, 'back')}</Button>
          {level < 3 && <Button onClick={nextLevel}>{lang === 'ar' ? 'المستوى التالي' : 'Next level'} →</Button>}
          <Button variant="secondary" onClick={() => load()}><RotateCcw className="mr-1 h-4 w-4" /> {t(lang, 'tryAgain')}</Button>
        </div>
      </div>
    )
  }

  const matchedCount = pairs.filter((p) => p.matched).length
  const progressPct = (matchedCount / pairs.length) * 100

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 md:py-6">
      {/* Top bar */}
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => go({ view: 'decks' })}>
          <ChevronLeft className="h-4 w-4" /> {t(lang, 'back')}
        </Button>
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{lang === 'ar' ? `المستوى ${level} • ${matchedCount}/${pairs.length}` : `Level ${level} • ${matchedCount}/${pairs.length}`}</span>
            <span>⏱ {elapsed}s • ❌ {mistakes}</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      </div>

      {/* Game board: two columns */}
      <div className="grid grid-cols-2 gap-3">
        {/* Problems */}
        <div className="space-y-2">
          <div className="text-center text-xs font-bold uppercase text-muted-foreground">{lang === 'ar' ? 'الأسئلة' : 'Problems'}</div>
          {leftItems.map((item, i) => (
            <button
              key={item.id}
              disabled={item.matched}
              onClick={() => tapLeft(i)}
              className={cn(
                'w-full rounded-xl border-2 p-3 text-center text-lg font-bold transition',
                item.matched ? 'border-emerald-400 bg-emerald-50 opacity-40 dark:bg-emerald-950/30' :
                selectedLeft === i ? 'border-primary bg-primary/10 ring-2 ring-primary/30' :
                'border-border hover:border-primary/50 bg-card'
              )}
            >
              {item.matched ? '✓' : item.text}
            </button>
          ))}
        </div>
        {/* Answers */}
        <div className="space-y-2">
          <div className="text-center text-xs font-bold uppercase text-muted-foreground">{lang === 'ar' ? 'الإجابات' : 'Answers'}</div>
          {rightItems.map((item, i) => (
            <button
              key={item.id}
              disabled={item.matched}
              onClick={() => tapRight(i)}
              className={cn(
                'w-full rounded-xl border-2 p-3 text-center text-lg font-bold transition',
                item.matched ? 'border-emerald-400 bg-emerald-50 opacity-40 dark:bg-emerald-950/30' :
                selectedRight === i ? 'border-primary bg-primary/10 ring-2 ring-primary/30' :
                'border-border hover:border-primary/50 bg-card'
              )}
            >
              {item.matched ? '✓' : item.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
