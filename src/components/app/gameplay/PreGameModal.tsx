'use client'

// Pre-game modal: shown when a level is selected. Player picks MCQ vs typed
// answer, optional timer, then starts the round.
//
// Split into outer (always-mounted Dialog) + inner (keyed by level id so
// useState initializers run fresh each time a new level is opened).

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useSettingsStore } from '@/store/settings-store'
import { useAppStore, type GameplayMode } from '@/store/app-store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useSound } from '@/hooks/use-sound'
import { t } from '@/lib/i18n'
import type { LevelInfo } from '@/types'
import { Crown, Zap, Clock, Type, ListChecks } from 'lucide-react'

const TIME_PER_QUESTION = 15 // seconds, when timer enabled

export function PreGameModal({
  level,
  worldName,
  worldEmoji,
  onClose,
}: {
  level: LevelInfo | null
  worldName: string
  worldEmoji: string
  onClose: () => void
}) {
  return (
    <Dialog open={!!level} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        {level && (
          <PreGameModalInner
            key={level.id}
            level={level}
            worldName={worldName}
            worldEmoji={worldEmoji}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function PreGameModalInner({
  level,
  worldName,
  worldEmoji,
  onClose,
}: {
  level: LevelInfo
  worldName: string
  worldEmoji: string
  onClose: () => void
}) {
  const lang = useSettingsStore((s) => s.lang)
  const { user } = useCurrentUser()
  const setGameplayConfig = useAppStore((s) => s.setGameplayConfig)
  const go = useAppStore((s) => s.go)
  const sfx = useSound()

  // Defaults: 8-13 → MCQ, 14-16 → typed. Timer on by default for 11+.
  const defaultMode: GameplayMode = user?.ageBand === '14-16' ? 'typed' : 'mcq'
  const defaultTimer = user?.ageBand ? user.ageBand !== '8-10' : true

  const [mode, setMode] = useState<GameplayMode>(defaultMode)
  const [timer, setTimer] = useState(defaultTimer)

  function start() {
    sfx('levelup')
    setGameplayConfig({ levelId: level.id, mode, timerEnabled: timer })
    onClose()
    go({ view: 'gameplay' })
  }

  return (
    <>
      <DialogHeader>
        <div className="mb-1 flex items-center gap-2">
          <span className="text-3xl">{worldEmoji}</span>
          <DialogTitle className="text-xl">
            {level.isBoss ? `👑 ${level.title}` : level.title}
          </DialogTitle>
        </div>
        <DialogDescription>
          {worldName} • {lang === 'ar' ? `مستوى ${level.levelNumber}` : `Level ${level.levelNumber}`} •
          {' '}{lang === 'ar' ? `${level.questionCount} أسئلة` : `${level.questionCount} questions`}
          {level.isBoss && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <Crown className="h-3 w-3" /> BOSS
            </span>
          )}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* Best score */}
        {level.bestStars ? (
          <div className="flex items-center gap-2 rounded-lg bg-muted p-2 text-sm">
            <span className="text-muted-foreground">{lang === 'ar' ? 'أفضل نتيجة:' : 'Best:'}</span>
            <span className="font-bold">{level.bestPercent}%</span>
            <span className="ml-auto flex gap-0.5">
              {[1, 2, 3].map((s) => (
                <span key={s} className={s <= level.bestStars! ? '' : 'opacity-30'}>⭐</span>
              ))}
            </span>
          </div>
        ) : null}

        {/* Mode picker */}
        <div>
          <Label className="mb-2 block">{lang === 'ar' ? 'نوع السؤال' : 'Question type'}</Label>
          <RadioGroup value={mode} onValueChange={(v) => { sfx('click'); setMode(v as GameplayMode) }} className="grid grid-cols-2 gap-2">
            <label className={mode === 'mcq' ? 'cursor-pointer rounded-xl border-2 border-primary bg-primary/5 p-3' : 'cursor-pointer rounded-xl border-2 border-border p-3'}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="mcq" id="m-mcq" />
                <ListChecks className="h-4 w-4" />
                <span className="text-sm font-bold">{lang === 'ar' ? 'اختيار' : 'Multiple choice'}</span>
              </div>
            </label>
            <label className={mode === 'typed' ? 'cursor-pointer rounded-xl border-2 border-primary bg-primary/5 p-3' : 'cursor-pointer rounded-xl border-2 border-border p-3'}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="typed" id="m-typed" />
                <Type className="h-4 w-4" />
                <span className="text-sm font-bold">{lang === 'ar' ? 'كتابة' : 'Type answer'}</span>
              </div>
            </label>
          </RadioGroup>
        </div>

        {/* Timer toggle */}
        <div className="flex items-center justify-between rounded-xl border-2 border-border p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <div>
              <div className="text-sm font-bold">{lang === 'ar' ? 'مؤقت لكل سؤال' : 'Timer per question'}</div>
              <div className="text-xs text-muted-foreground">{TIME_PER_QUESTION}s {lang === 'ar' ? 'لكل سؤال' : 'each'}</div>
            </div>
          </div>
          <Switch checked={timer} onCheckedChange={(v) => { sfx('click'); setTimer(v) }} />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => { sfx('click'); onClose() }}>
          {t(lang, 'cancel')}
        </Button>
        <Button onClick={start}>
          <Zap className="mr-1 h-4 w-4" /> {lang === 'ar' ? 'ابدأ!' : 'Start!'}
        </Button>
      </DialogFooter>
    </>
  )
}
