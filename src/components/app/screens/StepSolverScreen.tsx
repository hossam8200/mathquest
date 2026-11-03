'use client'

// Step-by-Step Solver screen — kids enter numbers and see the METHOD.
// Teaches HOW to solve, not just the answer.

import { useState } from 'react'
import { useSettingsStore } from '@/store/settings-store'
import { useAppStore } from '@/store/app-store'
import { useSound } from '@/hooks/use-sound'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, Lightbulb, Dice5, RotateCcw } from 'lucide-react'
import { t } from '@/lib/i18n'
import { solve, type SolveResult } from '@/lib/step-solver'
import { cn } from '@/lib/utils'

const OPS = [
  { key: 'addition', symbol: '+', emoji: '➕', color: 'from-rose-400 to-orange-400' },
  { key: 'subtraction', symbol: '−', emoji: '➖', color: 'from-emerald-400 to-teal-400' },
  { key: 'multiplication', symbol: '×', emoji: '✖️', color: 'from-amber-400 to-yellow-400' },
  { key: 'division', symbol: '÷', emoji: '➗', color: 'from-fuchsia-400 to-purple-400' },
]

export function StepSolverScreen() {
  const lang = useSettingsStore((s) => s.lang)
  const go = useAppStore((s) => s.go)
  const sfx = useSound()

  const [operation, setOperation] = useState('addition')
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [result, setResult] = useState<SolveResult | null>(null)

  function solveIt() {
    const numA = Number(a)
    const numB = Number(b)
    if (Number.isNaN(numA) || Number.isNaN(numB)) return
    sfx('flip')
    setResult(solve(operation, numA, numB))
  }

  function randomize() {
    sfx('click')
    setA(String(Math.floor(Math.random() * 90) + 10))
    setB(String(Math.floor(Math.random() * 9) + 2))
    setResult(null)
  }

  function reset() {
    setA(''); setB(''); setResult(null)
  }

  const opInfo = OPS.find(o => o.key === operation)!

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:py-10">
      <Button variant="ghost" size="sm" onClick={() => go({ view: 'home' })} className="mb-3">
        <ChevronLeft className="mr-1 h-4 w-4" /> {t(lang, 'back')}
      </Button>

      <div className="mb-6 text-center">
        <div className="text-6xl mq-float">💡</div>
        <h1 className="mt-2 text-3xl font-black">{lang === 'ar' ? 'حل خطوة بخطوة' : 'Step-by-Step Solver'}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === 'ar' ? 'أدخل رقمين وشاهد كيف تحل المسألة خطوة بخطوة' : 'Enter two numbers and see how to solve it step by step'}
        </p>
      </div>

      {/* Operation picker */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        {OPS.map(op => (
          <button
            key={op.key}
            onClick={() => { sfx('click'); setOperation(op.key); setResult(null) }}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition',
              operation === op.key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            )}
          >
            <span className="text-2xl">{op.emoji}</span>
            <span className="text-xs font-bold">{op.symbol}</span>
          </button>
        ))}
      </div>

      {/* Number inputs */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label>First number</Label>
              <Input
                type="number"
                value={a}
                onChange={e => { setA(e.target.value); setResult(null) }}
                placeholder="e.g. 7"
                className="text-2xl font-bold"
                autoFocus
              />
            </div>
            <div className="pb-2 text-3xl font-black text-primary">{opInfo.symbol}</div>
            <div className="flex-1">
              <Label>Second number</Label>
              <Input
                type="number"
                value={b}
                onChange={e => { setB(e.target.value); setResult(null) }}
                placeholder="e.g. 8"
                className="text-2xl font-bold"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button className="flex-1" onClick={solveIt} disabled={!a || !b}>
              <Lightbulb className="mr-1 h-4 w-4" /> {lang === 'ar' ? 'حل!' : 'Solve!'}
            </Button>
            <Button variant="outline" onClick={randomize}>
              <Dice5 className="mr-1 h-4 w-4" /> {lang === 'ar' ? 'عشوائي' : 'Random'}
            </Button>
            <Button variant="ghost" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className={cn('mq-pop overflow-hidden', result.highlight ? 'border-2 border-primary' : '')}>
          {/* Answer header */}
          <div className={cn('bg-gradient-to-r p-4 text-center text-white', opInfo.color)}>
            <div className="text-sm font-bold opacity-90">{result.method}</div>
            <div className="text-4xl font-black">
              {result.a} {result.symbol} {result.b} = {result.answer}
            </div>
          </div>

          {/* Steps */}
          <CardContent className="p-4">
            <h3 className="mb-3 flex items-center gap-1 text-sm font-bold">
              📝 {lang === 'ar' ? 'الخطوات' : 'Steps'}
            </h3>
            <div className="space-y-2">
              {result.steps.map((step, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-3 rounded-lg p-2',
                    step.highlight ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-muted'
                  )}
                >
                  <div className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black',
                    step.highlight ? 'bg-emerald-500 text-white' : 'bg-primary/20 text-primary'
                  )}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">{step.label}</div>
                    <div className="text-sm text-muted-foreground">{step.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tip */}
            <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs dark:bg-amber-950/20">
              💡 <span className="font-bold">{lang === 'ar' ? 'نصيحة:' : 'Tip:'}</span>{' '}
              {lang === 'ar' ? 'تدرب على هذه الطريقة حتى تصبح سهلة!' : 'Practice this method until it becomes easy!'}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Examples to try */}
      {!result && (
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-2 text-sm font-bold">{lang === 'ar' ? 'أمثلة للتجربة:' : 'Try these examples:'}</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '7 × 8', op: 'multiplication', a: '7', b: '8' },
                { label: '56 ÷ 7', op: 'division', a: '56', b: '7' },
                { label: '125 + 48', op: 'addition', a: '125', b: '48' },
                { label: '200 − 75', op: 'subtraction', a: '200', b: '75' },
              ].map(ex => (
                <button
                  key={ex.label}
                  onClick={() => {
                    setOperation(ex.op)
                    setA(ex.a)
                    setB(ex.b)
                    setResult(solve(ex.op, Number(ex.a), Number(ex.b)))
                    sfx('flip')
                  }}
                  className="rounded-lg border p-2 text-sm font-bold transition hover:bg-muted"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
