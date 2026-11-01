'use client'

// The mascot: shows the currently-equipped character (or a default fox)
// and reacts to gameplay events. Reads reaction from the app store.
// In Phase 4 this renders the equipped character's emoji from the marketplace.

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/app-store'
import { useSettingsStore } from '@/store/settings-store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useQuery } from '@tanstack/react-query'
import type { CharacterInfo } from '@/types'

export function Mascot({ size = 80 }: { size?: number }) {
  const reaction = useAppStore((s) => s.mascotReaction)
  const setReaction = useAppStore((s) => s.setMascotReaction)
  const lang = useSettingsStore((s) => s.lang)
  const { user } = useCurrentUser()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch the equipped character's art (if any). This is cached by React Query.
  const { data: equippedChar } = useQuery<{ characters: CharacterInfo[] }>({
    queryKey: ['marketplace'],
    queryFn: async () => {
      const r = await fetch('/api/marketplace/list', { cache: 'no-store' })
      if (!r.ok) return { characters: [] }
      return r.json()
    },
    enabled: !!user,
    staleTime: 60_000,
  })
  const char = equippedChar?.characters.find((c) => c.id === user?.avatarCharacterId)
  const baseEmoji = char?.artPayload ?? '🦊'

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
    baseEmoji

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
    ''

  return (
    <div className="flex items-end gap-2" aria-live="polite">
      <div
        className={cls}
        style={{ fontSize: size, lineHeight: 1, userSelect: 'none' }}
        role="img"
        aria-label={char?.name ?? 'Mascot'}
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
