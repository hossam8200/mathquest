'use client'

// Flashcard Learn screen: adaptive spaced-repetition study session.
// Fetches due + new cards, presents them one by one with a flip animation,
// lets the child self-rate (Got it / Almost / Not yet), and applies SM-2.

import { useEffect, useState, useRef, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import { useSettingsStore } from '@/store/settings-store'
import { useSound } from '@/hooks/use-sound'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, RotateCcw, Check } from 'lucide-react'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { CardInfo } from '@/types'

interface DueResponse {
  cards: CardInfo[]
  newCount: number
  dueCount: number
  weakCount: number
}

export function FlashcardLearnScreen() {
  const lang = useSettingsStore((s) => s.lang)
  const go = useAppStore((s) => s.go)
  const deckId = useAppStore((s) => s.selectedDeckId)
  const sfx = useSound()
  const { toast } = useToast()

  const [cards, setCards] = useState<CardInfo[]>([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState({ reviewed: 0, newLearned: 0, correct: 0, startTime: 0 })
  const [done, setDone] = useState(false)
  const sessionRef = useRef(session)
  useEffect(() => { sessionRef.current = session }, [session])

  const load = useCallback(async () => {
    if (!deckId) return
    setLoading(true)
    setDone(false)
    const weakOnly = typeof window !== 'undefined' && sessionStorage.getItem('mq-weak-only') === '1'
    const r = await fetch(`/api/decks/due-cards?deckId=${deckId}&limit=20${weakOnly ? '&weakOnly=true' : ''}`, { cache: 'no-store' })
    const data: DueResponse = await r.json()
    setCards(data.cards)
    setIdx(0)
    setFlipped(false)
    setSession({ reviewed: 0, newLearned: 0, correct: 0, startTime: Date.now() })
    setLoading(false)
  }, [deckId])

  // load() runs an async data fetch; setLoading(true) at its start is the
  // standard fetch pattern. Suppressed per-line.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const current = cards[idx]

  function flip() {
    if (flipped) return
    sfx('flip')
    setFlipped(true)
  }

  async function rate(rating: 'again' | 'hard' | 'good' | 'easy', wasCorrect: boolean) {
    if (!current) return
    sfx(wasCorrect ? 'correct' : 'wrong')
    // Submit review
    try {
      await fetch('/api/decks/review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: current.id, rating, wasCorrect }),
      })
    } catch {
      // best-effort
    }

    const wasNew = current.status === 'new'
    setSession((s) => ({
      ...s,
      reviewed: s.reviewed + 1,
      newLearned: s.newLearned + (wasNew && wasCorrect ? 1 : 0),
      correct: s.correct + (wasCorrect ? 1 : 0),
    }))

    if (idx + 1 >= cards.length) {
      // Session done — record + show summary
      await finishSession()
    } else {
      setIdx((i) => i + 1)
      setFlipped(false)
    }
  }

  async function finishSession() {
    const s = sessionRef.current
    const durationSec = Math.round((Date.now() - s.startTime) / 1000)
    try {
      const r = await fetch('/api/decks/study-session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckId, cardsReviewed: s.reviewed, newLearned: s.newLearned,
          correctCount: s.correct, durationSec,
        }),
      })
      const data = await r.json()
      sfx('coin')
      setDone(true)
      if (data.coinsEarned > 0) {
        toast({ title: `+${data.coinsEarned} coins!` })
      }
    } catch {
      setDone(true)
    }
  }

  function restart() {
    load()
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
        <div className="text-6xl mq-bounce">📚</div>
        <p className="mt-4 text-muted-foreground">{lang === 'ar' ? 'جاري التحميل…' : 'Loading…'}</p>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <div className="text-6xl mq-float">🎉</div>
        <h2 className="mt-4 text-xl font-bold">{lang === 'ar' ? 'لا بطاقات لمراجعتها الآن!' : 'No cards to review right now!'}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === 'ar' ? 'عُد لاحقاً أو جرّب مجموعة أخرى.' : 'Come back later or try another deck.'}
        </p>
        <Button className="mt-4" onClick={() => go({ view: 'decks' })}>{t(lang, 'back')}</Button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <div className="text-6xl mq-celebrate">🎉</div>
        <h2 className="mt-4 text-2xl font-black">{t(lang, 'sessionSummary')}</h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-muted p-3">
            <div className="text-2xl font-black">{session.reviewed}</div>
            <div className="text-[10px] text-muted-foreground">{t(lang, 'cardsReviewed')}</div>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <div className="text-2xl font-black text-emerald-500">{session.newLearned}</div>
            <div className="text-[10px] text-muted-foreground">{t(lang, 'newLearned')}</div>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <div className="text-2xl font-black text-amber-500">{session.reviewed - session.correct}</div>
            <div className="text-[10px] text-muted-foreground">{t(lang, 'toReviewAgain')}</div>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" onClick={() => go({ view: 'decks' })}>{t(lang, 'back')}</Button>
          <Button onClick={restart}><RotateCcw className="mr-1 h-4 w-4" /> {lang === 'ar' ? 'مرة أخرى' : 'Study more'}</Button>
        </div>
      </div>
    )
  }

  if (!current) return null

  const progressPct = (idx / cards.length) * 100

  return (
    <div className="mx-auto max-w-lg px-4 py-4 md:py-6">
      {/* Top bar */}
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => go({ view: 'decks' })}>
          <ChevronLeft className="h-4 w-4" /> {t(lang, 'back')}
        </Button>
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{lang === 'ar' ? `بطاقة ${idx + 1} من ${cards.length}` : `Card ${idx + 1} of ${cards.length}`}</span>
            <span>{lang === 'ar' ? 'صحيحة' : 'Correct'}: {session.correct}</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      </div>

      {/* Flashcard with 3D flip */}
      <div
        className="relative cursor-pointer select-none"
        style={{ perspective: '1000px' }}
        onClick={flip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip() } }}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '280px',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-2 border-primary/20 bg-card p-8 shadow-md"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <div className="text-xs font-bold uppercase text-muted-foreground">{lang === 'ar' ? 'السؤال' : 'Question'}</div>
            <div className="my-4 text-5xl font-black tracking-tight md:text-6xl">{current.front}</div>
            <div className="mt-4 text-sm text-muted-foreground">
              {lang === 'ar' ? 'اضغط للقلب' : 'Tap to flip'} ↔️
            </div>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-2 border-emerald-400 bg-emerald-50 p-8 shadow-md dark:bg-emerald-950/30"
            style={{
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">{lang === 'ar' ? 'الإجابة' : 'Answer'}</div>
            <div className="my-4 text-5xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 md:text-6xl">{current.back}</div>
            {current.explanation && (
              <div className="mt-2 rounded-lg bg-white/50 p-2 text-xs text-muted-foreground dark:bg-black/20">
                {current.explanation}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating buttons (after flip) */}
      {flipped && (
        <div className="mt-6 grid grid-cols-3 gap-2 mq-pop">
          <Button variant="outline" className="border-rose-300 text-rose-600 hover:bg-rose-50" onClick={() => rate('again', false)}>
            {t(lang, 'notYet')}
          </Button>
          <Button variant="outline" className="border-amber-300 text-amber-600 hover:bg-amber-50" onClick={() => rate('hard', true)}>
            {t(lang, 'almost')}
          </Button>
          <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={() => rate('good', true)}>
            <Check className="mr-1 h-4 w-4" /> {t(lang, 'gotIt')}
          </Button>
        </div>
      )}

      {/* Hint (before flip) */}
      {!flipped && current.hint && (
        <div className="mt-4 rounded-xl bg-muted p-3 text-center text-sm text-muted-foreground">
          💡 {current.hint}
        </div>
      )}
    </div>
  )
}
