'use client'

// GameplayScreen: the actual quiz.
// Reads gameplayConfig from the app store, fetches questions on mount, plays
// through them, submits the round on completion, and shows the level-complete
// dialog.

import { useEffect, useRef, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { useSettingsStore } from '@/store/settings-store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useSound } from '@/hooks/use-sound'
import { useToast } from '@/hooks/use-toast'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, Clock, Flame, Check, X } from 'lucide-react'
import type { Question } from '@/lib/math-engine'
import type { CharacterInfo } from '@/types'
import { Mascot } from '../gameplay/Mascot'
import { FeedbackBurst, type Feedback } from '../gameplay/FeedbackBurst'
import { LevelCompleteDialog, type LevelCompleteData } from '../gameplay/LevelCompleteDialog'
import { cn } from '@/lib/utils'

const TIME_PER_QUESTION = 15 // base seconds per question
// Character "time" perk adds this many seconds on top.

interface LevelMeta {
  id: string
  title: string
  isBoss: boolean
  questionCount: number
  difficulty: number
  worldName: string
  worldEmoji: string
  operation: string
}

export function GameplayScreen() {
  const lang = useSettingsStore((s) => s.lang)
  const go = useAppStore((s) => s.go)
  const config = useAppStore((s) => s.gameplayConfig)
  const setGameplayConfig = useAppStore((s) => s.setGameplayConfig)
  const { user } = useCurrentUser()
  const sfx = useSound()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [level, setLevel] = useState<LevelMeta | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [attemptId, setAttemptId] = useState<string | null>(null)

  const [idx, setIdx] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [answers, setAnswers] = useState<{ idx: number; userAnswer: string | null; timeMs: number }[]>([])
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION)

  // Equipped character perk (extra time). Fetched once, cached by React Query.
  const perkSeconds = useEquippedPerkSeconds()
  const effectiveTimeRef = useRef(TIME_PER_QUESTION)
  effectiveTimeRef.current = TIME_PER_QUESTION + perkSeconds
  const [complete, setComplete] = useState<LevelCompleteData | null>(null)

  const questionStartRef = useRef<number>(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const answeredRef = useRef(false)

  // Fetch questions when the level changes OR when retryNonce is bumped
  // (for "Play again"). Kept inline in the effect so the only dependencies
  // are `config?.levelId` and `retryNonce` — other values (lang, toast, user)
  // are read via refs to avoid re-fetching (and wiping the complete dialog)
  // when the user object updates after a round submission.
  const langRef = useRef(lang)
  langRef.current = lang
  const toastRef = useRef(toast)
  toastRef.current = toast
  const goRef = useRef(go)
  goRef.current = go
  const [retryNonce, setRetryNonce] = useState(0)

  useEffect(() => {
    if (!config?.levelId) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setComplete(null)
      setIdx(0); setAnswers([]); setStreak(0); setBestStreak(0)
      setFeedback(null); setUserAnswer(''); setSelectedOption(null)
      answeredRef.current = false
      try {
        const r = await fetch(`/api/gameplay/questions?levelId=${config!.levelId}`, { cache: 'no-store' })
        const data = await r.json()
        if (cancelled) return
        if (!r.ok) {
          const l = langRef.current
          const msg = data.error === 'LOCKED' ? (l === 'ar' ? 'هذا المستوى مقفل' : 'This level is locked') :
                      (l === 'ar' ? 'تعذر تحميل الأسئلة' : 'Could not load questions')
          toastRef.current({ title: msg, variant: 'destructive' })
          goRef.current({ view: 'worlds' })
          return
        }
        setLevel(data.level)
        setQuestions(data.questions)
        setAttemptId(data.attemptId)
        setTimeLeft(effectiveTimeRef.current)
        questionStartRef.current = Date.now()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [config?.levelId, retryNonce])

  // "Play again" — bump the nonce to re-run the load effect above.
  const fetchQuestions = useCallback(() => setRetryNonce((n) => n + 1), [])

  // Timer
  useEffect(() => {
    if (!config?.timerEnabled || feedback || loading || complete) return
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time's up — treat as wrong (no answer)
          if (!answeredRef.current) {
            handleTimeout()
          }
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [config, feedback, loading, complete, idx])

  const current = questions[idx]

  function handleTimeout() {
    if (answeredRef.current) return
    answeredRef.current = true
    if (timerRef.current) clearInterval(timerRef.current)
    const q = questions[idx]
    setFeedback({
      isCorrect: false,
      correctAnswer: String(q.answer),
      explanation: q.explanation,
    })
    setStreak(0)
    const elapsed = Date.now() - questionStartRef.current
    setAnswers((a) => [...a, { idx, userAnswer: null, timeMs: elapsed }])
    setBestStreak((b) => Math.max(b, 0))
  }

  function submit(value: string | number | null) {
    if (answeredRef.current || !current) return
    answeredRef.current = true
    if (timerRef.current) clearInterval(timerRef.current)

    const q = current
    const ua = value === null ? null : String(value)
    const correct = ua !== null && Math.abs(Number(ua) - q.answer) < 1e-6

    setFeedback({
      isCorrect: correct,
      correctAnswer: String(q.answer),
      explanation: q.explanation,
    })

    if (correct) {
      setStreak((s) => {
        const ns = s + 1
        setBestStreak((b) => Math.max(b, ns))
        return ns
      })
    } else {
      setStreak(0)
    }

    const elapsed = Date.now() - questionStartRef.current
    setAnswers((a) => [...a, { idx, userAnswer: ua, timeMs: elapsed }])
  }

  function next() {
    if (idx + 1 >= questions.length) {
      // Round done — submit to server
      finish()
      return
    }
    setIdx((i) => i + 1)
    setUserAnswer('')
    setSelectedOption(null)
    setFeedback(null)
    answeredRef.current = false
    setTimeLeft(effectiveTimeRef.current)
    questionStartRef.current = Date.now()
  }

  async function finish() {
    if (!attemptId) return
    // Compute total duration
    const durationMs = answers.reduce((sum, a) => sum + a.timeMs, 0)
    try {
      const r = await fetch('/api/gameplay/submit-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          answers,
          durationMs,
          bestStreak,
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        toast({ title: lang === 'ar' ? 'تعذر حفظ النتيجة' : 'Could not save result', variant: 'destructive' })
        return
      }
      sfx('coin')
      setComplete(data)
    } catch {
      toast({ title: lang === 'ar' ? 'خطأ في الشبكة' : 'Network error', variant: 'destructive' })
    }
  }

  function playAgain() {
    setComplete(null)
    fetchQuestions()
  }

  function backToMap() {
    setComplete(null)
    setGameplayConfig(null)
    go({ view: 'worlds' })
  }

  // Render
  if (!config) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <p className="text-muted-foreground">{lang === 'ar' ? 'لا يوجد مستوى مختار.' : 'No level selected.'}</p>
        <Button className="mt-4" onClick={() => go({ view: 'worlds' })}>{t(lang, 'worlds')}</Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <div className="text-6xl mq-bounce">🦊</div>
        <p className="mt-4 text-sm text-muted-foreground">{lang === 'ar' ? 'جاري التحميل…' : 'Loading…'}</p>
      </div>
    )
  }

  if (!current) return null

  const progressPct = (idx / questions.length) * 100
  const ageBand = user?.ageBand

  return (
    <div className="relative mx-auto max-w-2xl px-4 py-4 md:py-6">
      <FeedbackBurst feedback={feedback} />

      {/* Top bar */}
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={backToMap}>
          <ChevronLeft className="h-4 w-4" /> {t(lang, 'back')}
        </Button>
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold">{level?.emoji ?? ''} {level?.title}</span>
            <span>{idx + 1} / {questions.length}</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-4 flex justify-end gap-2">
        {config.timerEnabled && (
          <div className={cn(
            'flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold',
            timeLeft <= 5 ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' : 'bg-muted'
          )}>
            <Clock className="h-4 w-4" />
            {timeLeft}s
          </div>
        )}
        <div className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          <Flame className="h-4 w-4" />
          {streak}
        </div>
      </div>

      {/* Question card */}
      <div className="relative rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-md md:p-8">
        <div className="mb-4 flex justify-center">
          <Mascot size={64} />
        </div>

        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {level?.worldEmoji} {level?.worldName} • {lang === 'ar' ? 'صعوبة' : 'Difficulty'} {level?.difficulty}
          </div>
          <div className="my-4 text-5xl font-black tracking-tight md:text-6xl">
            {current.prompt} <span className="text-primary">= ?</span>
          </div>
          {current.hint && (
            <div className="mx-auto mb-3 max-w-xs rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground">
              💡 {current.hint}
            </div>
          )}
        </div>

        {/* Answer area */}
        {config.mode === 'mcq' ? (
          <div className="mt-6 grid grid-cols-2 gap-3">
            {current.options.map((opt, i) => (
              <button
                key={i}
                data-mc-option
                disabled={!!feedback}
                onClick={() => {
                  if (answeredRef.current) return
                  setSelectedOption(i)
                  submit(opt)
                }}
                className={cn(
                  'rounded-2xl border-2 p-4 text-2xl font-black transition md:text-3xl',
                  feedback
                    ? opt === current.answer
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30'
                      : selectedOption === i
                        ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/30'
                        : 'border-border opacity-50'
                    : 'border-border hover:border-primary hover:bg-primary/5 active:scale-95',
                  ageBand === '8-10' && 'min-h-16 md:min-h-20'
                )}
              >
                {opt}
                {feedback && opt === current.answer && <Check className="ml-1 inline h-5 w-5" />}
                {feedback && selectedOption === i && opt !== current.answer && <X className="ml-1 inline h-5 w-5" />}
              </button>
            ))}
          </div>
        ) : (
          <form
            className="mt-6 flex gap-2"
            onSubmit={(e) => { e.preventDefault(); if (!answeredRef.current) submit(userAnswer) }}
          >
            <Input
              autoFocus
              type="text"
              inputMode="numeric"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={!!feedback}
              placeholder={t(lang, 'typeAnswer')}
              className="text-2xl font-bold"
            />
            <Button type="submit" disabled={!!feedback || !userAnswer}>
              {t(lang, 'check')}
            </Button>
          </form>
        )}
      </div>

      {/* Next button (visible after answering) */}
      {feedback && (
        <div className="mt-4 flex justify-center">
          <Button size="lg" onClick={next} className="mq-pop">
            {idx + 1 >= questions.length ? (lang === 'ar' ? 'إنهاء' : 'Finish') : t(lang, 'next')} →
          </Button>
        </div>
      )}

      <LevelCompleteDialog data={complete} onPlayAgain={playAgain} onBackToMap={backToMap} />
    </div>
  )
}

// Fetches the equipped character's time perk (seconds added to timer).
function useEquippedPerkSeconds(): number {
  const { user } = useCurrentUser()
  const { data } = useQuery<{ characters: CharacterInfo[] }>({
    queryKey: ['marketplace'],
    queryFn: async () => {
      const r = await fetch('/api/marketplace/list', { cache: 'no-store' })
      if (!r.ok) return { characters: [] }
      return r.json()
    },
    enabled: !!user,
    staleTime: 60_000,
  })
  const char = data?.characters.find((c) => c.id === user?.avatarCharacterId)
  if (char?.perkType === 'time' && char.perkValue) return char.perkValue
  return 0
}
