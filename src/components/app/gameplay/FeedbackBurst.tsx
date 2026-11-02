'use client'

// FeedbackBurst: shown briefly after each answer.
// Renders the correct/wrong banner + (for wrong) the correct answer + explanation.
// Plays the right sound and triggers the mascot reaction via the app store.

import { useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { useSound } from '@/hooks/use-sound'
import { useSettingsStore } from '@/store/settings-store'
import { t } from '@/lib/i18n'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Feedback {
  isCorrect: boolean
  correctAnswer: string
  explanation?: string
}

export function FeedbackBurst({ feedback }: { feedback: Feedback | null }) {
  const setMascotReaction = useAppStore((s) => s.setMascotReaction)
  const sfx = useSound()
  const lang = useSettingsStore((s) => s.lang)

  useEffect(() => {
    if (!feedback) return
    if (feedback.isCorrect) {
      sfx('correct')
      setMascotReaction('cheer')
    } else {
      sfx('wrong')
      setMascotReaction('sad')
    }
  }, [feedback, sfx, setMascotReaction])

  if (!feedback) return null

  return (
    <div
      className={cn(
        'mq-pop pointer-events-none absolute inset-x-0 top-2 z-20 mx-auto flex max-w-md flex-col items-center gap-1 rounded-2xl px-4 py-3 text-center shadow-lg',
        feedback.isCorrect
          ? 'bg-emerald-500 text-white'
          : 'bg-rose-500 text-white'
      )}
      role="status"
      aria-live="assertive"
    >
      <div className="flex items-center gap-2 font-bold">
        {feedback.isCorrect ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
        {feedback.isCorrect ? t(lang, 'correct') : t(lang, 'wrong')}
      </div>
      {!feedback.isCorrect && (
        <div className="text-sm">
          {t(lang, 'correctAnswerWas')} <strong>{feedback.correctAnswer}</strong>
          {feedback.explanation && (
            <div className="mt-0.5 text-xs text-white/90">{feedback.explanation}</div>
          )}
        </div>
      )}
    </div>
  )
}
