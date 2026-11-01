'use client'

// Coming-soon placeholder for screens not built yet.

import { useSettingsStore } from '@/store/settings-store'
import { useAppStore } from '@/store/app-store'
import { t, type DictKey } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { ViewKey } from '@/types'

const VIEW_ICON: Record<ViewKey, string> = {
  home: '🏠',
  worlds: '🗺️',
  gameplay: '🎮',
  marketplace: '🛒',
  collection: '🎒',
  decks: '🗂️',
  'flashcard-learn': '📖',
  'match-game': '🃏',
  progress: '📊',
  leaderboard: '🏆',
  daily: '📅',
  parent: '👨‍👩‍👧',
  admin: '🛡️',
  settings: '⚙️',
}

export function ComingSoon({ view, phase }: { view: ViewKey; phase: string }) {
  const lang = useSettingsStore((s) => s.lang)
  const go = useAppStore((s) => s.go)
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="text-7xl mq-float">{VIEW_ICON[view]}</div>
          <h2 className="text-2xl font-bold">{t(lang, view as DictKey)}</h2>
          <p className="text-sm text-muted-foreground">
            {lang === 'ar'
              ? `يتم بناء هذه الشاشة في ${phase}.`
              : `This screen is being built in ${phase}.`}
          </p>
          <Button variant="outline" onClick={() => go({ view: 'home' })}>
            {t(lang, 'back')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
