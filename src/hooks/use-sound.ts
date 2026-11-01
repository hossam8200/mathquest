'use client'

// Hook: plays a sound if the user has sound enabled.
import { useCallback } from 'react'
import { play, unlockAudio } from '@/lib/sounds'
import { useSettingsStore } from '@/store/settings-store'

export function useSound() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  return useCallback(
    (name: Parameters<typeof play>[0]) => {
      if (!soundEnabled) return
      unlockAudio()
      play(name)
    },
    [soundEnabled]
  )
}
