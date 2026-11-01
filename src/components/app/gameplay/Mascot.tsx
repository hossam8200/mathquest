'use client'

// The mascot: shows the currently-equipped character (or a default emoji)
// and reacts to gameplay events. Reads reaction from the app store.
// In Phase 4 this will render the actual equipped character SVG; for now
// it uses the default emoji mascot.

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/app-store'
import { useSettingsStore } from '@/store/settings-store'
import { useCurrentUser } from '@/hooks/use-current-user'

export function Mascot({ size = 80 }: { size?: number }) {
  const reaction = useAppStore((s) => s.mascotReaction)
  const setReaction = useAppStore((s) => s.setMascotReaction)
  const lang = useSettingsStore((s) => s.lang)
  const { user } = useCurrentUser()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-clear temporary reactions back to idle.
  useEffect(() => {
    if (reaction === 'idle' || reaction === 'thinking') return
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setReaction('idle'), 1600)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [reaction, setReaction])

  const emoji =
    reaction === 'celebrate' ? '🤩' :
    reaction === 'cheer'     ? '😊' :
    reaction === 'sad'       ? '😟' :
    reaction === 'thinking'  ? '🤔' :
    '🦊'

  const cls =
    reaction === 'celebrate' ? 'mq-celebrate' :
    reaction === 'cheer'     ? 'mq-bounce' :
    reaction === 'sad'       ? 'mq-shake' :
    reaction === 'thinking'  ? 'mq-wiggle' :
    'mq-float'

  // Speech bubble
  const line =
    reaction === 'celebrate' ? (lang === 'ar' ? 'رائع جداً!' : 'Amazing!') :
    reaction === 'cheer'     ? (lang === 'ar' ? 'أحسنت!' : 'Nice!') :
    reaction === 'sad'       ? (lang === 'ar' ? 'لا بأس، حاول مجددًا' : 'Almost! Try again') :
    reaction === 'thinking'  ? (lang === 'ar' ? 'هممم...' : 'Hmm...') :
    (lang === 'ar' ? 'هيا نتعلم!' : "Let's learn!")

  return (
    <div className="flex items-end gap-2" aria-live="polite">
      <div
        className={cls}
        style={{ fontSize: size, lineHeight: 1, userSelect: 'none' }}
        role="img"
        aria-label={emoji}
      >
        {emoji}
      </div>
      {line && (
        <div className="mb-2 rounded-2xl bg-card px-3 py-1.5 text-sm font-medium shadow-sm border">
          {line}
        </div>
      )}
    </div>
  )
}
