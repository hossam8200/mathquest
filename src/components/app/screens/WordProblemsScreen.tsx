'use client'

// Word Problems screen — real-world math scenarios.
// Kids pick an operation (or mixed), answer 5 word problems with MCQ,
// and get immediate feedback with a solution explanation.

import { useState, useCallback } from 'react'
import { useSettingsStore } from '@/store/settings-store'
import { useAppStore } from '@/store/app-store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useSound } from '@/hooks/use-sound'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, Check, X, RotateCcw, BookOpen, Trophy } from 'lucide-react'
import { t } from '@/lib/i18n'
import { generateWordProblemSet, type WordProblem } from '@/lib/word-problems'
import { avatarUrl } from '@/lib/dicebear'
import type { Operation } from '@/types'
import { cn } from '@/lib/utils'

const OPS: { key: Operation; emoji: string; label: string; color: string }[] = [
  { key: 'addition', emoji: '➕', label: 'Addition', color: 'from-rose-400 to-orange-400' },
  { key: 'subtraction', emoji: '➖', label: 'Subtraction', color: 'from-emerald-400 to-teal-400' },
  { key: 'multiplication', emoji: '✖️', label: 'Multiplication', color: 'from-amber-400 to-yellow-400' },
  { key: 'division', emoji: '➗', label: 'Division', color: 'from-fuchsia-400 to-purple-400' },
  { key: 'mixed', emoji: '🎲', label: 'Mixed', color: 'from-sky-400 to-cyan-400' },
]

export function WordProblemsScreen() {
  const lang = useSettingsStore((s) => s.lang)
  const go = useAppStore((s) => s.go)
  const { user } = useCurrentUser()
  const sfx = useSound()

  const [selectedOp, setSelectedOp] = useState<Operation | null>(null)
  const [problems, setProblems] = useState<WordProblem[]>([])
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)

  const start = useCallback((op: Operation) => {
    if (!user?.ageBand) return
    sfx('click')
    const set = generateWordProblemSet(op, user.ageBand, 5)
    setSelectedOp(op)
    setProblems(set)
    setIdx(0)
    setSelected(null)
    setFeedback(null)
    setCorrectCount(0)
    setDone(false)
  }, [user, sfx])

  const current = problems[idx]

  function answer(value: number) {
    if (feedback) return
    setSelected(value)
    const isCorrect = value === current.answer
    if (isCorrect) {
      sfx('correct')
      setCorrectCount(c => c + 1)
      setFeedback('✅ ' + current.solution)
    } else {
      sfx('wrong')
      setFeedback(`❌ The answer was ${current.answer}. ${current.solution}`)
    }
  }

  function next() {
    if (idx + 1 >= problems.length) {
      sfx('levelup')
      setDone(true)
    } else {
      setIdx(i => i + 1)
      setSelected(null)
      setFeedback(null)
    }
  }

  function restart() {
    if (selectedOp) start(selectedOp)
  }

  if (!selectedOp) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 md:py-10">
        <Button variant="ghost" size="sm" onClick={() => go({ view: 'home' })} className="mb-3">
          <ChevronLeft className="mr-1 h-4 w-4" /> {t(lang, 'back')}
        </Button>
        <div className="mb-6 text-center">
          <div className="text-6xl mq-bounce">📖</div>
          <h1 className="mt-2 text-3xl font-black">{lang === 'ar' ? 'مسائل كلامية' : 'Word Problems'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lang === 'ar' ? 'تدرب على الرياضيات في مواقف حقيقية!' : 'Practice math in real-life scenarios!'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {OPS.map(op => (
            <button
              key={op.key}
              onClick={() => start(op.key)}
              className={cn('group flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br p-6 text-white shadow-md transition hover:-translate-y-1 hover:shadow-lg', op.color)}
            >
              <span className="text-4xl">{op.emoji}</span>
              <span className="font-bold">{op.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (done) {
    const pct = Math.round((correctCount / problems.length) * 100)
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <div className="text-6xl mq-celebrate">{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪'}</div>
        <h2 className="mt-4 text-2xl font-black">{lang === 'ar' ? 'انتهت المسائل!' : 'Problems Complete!'}</h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-muted p-3">
            <div className="text-2xl font-black">{correctCount}/{problems.length}</div>
            <div className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'صحيحة' : 'Correct'}</div>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <div className="text-2xl font-black text-emerald-500">{pct}%</div>
            <div className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'دقة' : 'Accuracy'}</div>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <div className="text-2xl font-black text-amber-500">{pct >= 80 ? '⭐⭐⭐' : pct >= 60 ? '⭐⭐' : '⭐'}</div>
            <div className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'تقييم' : 'Rating'}</div>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" onClick={() => go({ view: 'home' })}>{t(lang, 'back')}</Button>
          <Button onClick={restart}><RotateCcw className="mr-1 h-4 w-4" /> {lang === 'ar' ? 'مرة أخرى' : 'Try Again'}</Button>
        </div>
      </div>
    )
  }

  if (!current) return null
  const progressPct = (idx / problems.length) * 100

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 md:py-6">
      {/* Top bar */}
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => go({ view: 'home' })}>
          <ChevronLeft className="h-4 w-4" /> {t(lang, 'back')}
        </Button>
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span className="font-bold">📖 {lang === 'ar' ? `مسألة ${idx + 1} من ${problems.length}` : `Problem ${idx + 1} of ${problems.length}`}</span>
            <span>{lang === 'ar' ? 'صحيحة' : 'Correct'}: {correctCount}</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      </div>

      {/* Word problem card */}
      <Card className="mb-4 overflow-hidden">
        <div className="bg-gradient-to-r from-sky-400 to-cyan-400 p-2 flex items-center justify-center gap-2">
          {/* DiceBear avatar for the word problem character */}
          <img src={avatarUrl(current.scenario.slice(0, 10), 'fun-emoji', 32)} alt="character" width={32} height={32} className="rounded-full" loading="lazy" />
          <span className="text-2xl">{current.emoji}</span>
        </div>
        <CardContent className="p-6">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {current.operation}
          </div>
          <p className="text-lg font-medium leading-relaxed">
            {current.scenario}
          </p>
          <p className="mt-2 text-xl font-black text-primary">
            {current.question}
          </p>
        </CardContent>
      </Card>

      {/* MCQ options */}
      <div className="grid grid-cols-2 gap-3">
        {current.options.map((opt, i) => (
          <button
            key={i}
            disabled={!!feedback}
            onClick={() => answer(opt)}
            className={cn(
              'rounded-2xl border-2 p-4 text-2xl font-black transition',
              feedback
                ? opt === current.answer
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30'
                  : selected === opt
                    ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/30'
                    : 'border-border opacity-50'
                : 'border-border hover:border-primary hover:bg-primary/5 active:scale-95',
            )}
          >
            {opt}
            {feedback && opt === current.answer && <Check className="ml-1 inline h-5 w-5" />}
            {feedback && selected === opt && opt !== current.answer && <X className="ml-1 inline h-5 w-5" />}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="mt-4 rounded-xl bg-muted p-4 text-sm mq-pop">
          <div className="font-bold text-primary">💡 {lang === 'ar' ? 'الحل' : 'Solution'}</div>
          <p className="mt-1 text-muted-foreground">{feedback}</p>
        </div>
      )}

      {/* Next button */}
      {feedback && (
        <div className="mt-4 flex justify-center">
          <Button size="lg" onClick={next} className="mq-pop">
            {idx + 1 >= problems.length ? (lang === 'ar' ? 'إنهاء' : 'Finish') : t(lang, 'next')} →
          </Button>
        </div>
      )}
    </div>
  )
}
