'use client'

// Level-complete dialog: shows percent, stars, points, coins, new badges,
// and Play again / Back to map buttons. Confetti fires on pass.

import { useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useSettingsStore } from '@/store/settings-store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useSound } from '@/hooks/use-sound'
import { t } from '@/lib/i18n'
import { Star, Coins, Zap, RotateCcw, Map as MapIcon } from 'lucide-react'
import { Confetti } from './Confetti'
import { cn } from '@/lib/utils'

export interface LevelCompleteData {
  percent: number
  stars: number
  pointsEarned: number
  coinsEarned: number
  passed: boolean
  correctCount: number
  totalCount: number
  newBadges: { key: string; name: string; emoji: string; coinReward: number }[]
  unlockedNext: boolean
}

export function LevelCompleteDialog({
  data,
  onPlayAgain,
  onBackToMap,
}: {
  data: LevelCompleteData | null
  onPlayAgain: () => void
  onBackToMap: () => void
}) {
  const lang = useSettingsStore((s) => s.lang)
  const { refresh } = useCurrentUser()
  const sfx = useSound()

  useEffect(() => {
    if (data) {
      refresh()
      if (data.passed) {
        if (data.stars === 3) sfx('levelup')
        else sfx('correct')
      } else {
        sfx('lose')
      }
    }
  }, [data, refresh, sfx])

  return (
    <Dialog open={!!data} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        {data?.passed && <Confetti key={`confetti-${data.percent}-${Date.now()}`} count={data.stars === 3 ? 50 : 25} />}
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {data?.passed ? (lang === 'ar' ? 'أحسنت!' : 'Level complete!') : (lang === 'ar' ? 'حاول مجددًا' : 'Keep trying!')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {data?.correctCount}/{data?.totalCount} {lang === 'ar' ? 'صحيحة' : 'correct'}
          </DialogDescription>
        </DialogHeader>

        {data && (
          <div className="space-y-4 py-2">
            {/* Stars */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    'h-12 w-12 transition',
                    data.stars >= s ? 'fill-amber-400 text-amber-400 mq-pop' : 'fill-none text-muted-foreground/40'
                  )}
                  style={{ animationDelay: `${s * 0.15}s` }}
                />
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-muted p-2">
                <div className="text-xl font-black">{data.percent}%</div>
                <div className="text-[10px] text-muted-foreground">{t(lang, 'score')}</div>
              </div>
              <div className="rounded-xl bg-muted p-2">
                <div className="text-xl font-black flex items-center justify-center gap-1">
                  <Zap className="h-4 w-4 text-amber-500" />{data.pointsEarned}
                </div>
                <div className="text-[10px] text-muted-foreground">{t(lang, 'points')}</div>
              </div>
              <div className="rounded-xl bg-muted p-2">
                <div className="text-xl font-black flex items-center justify-center gap-1">
                  <Coins className="h-4 w-4 text-yellow-500" />{data.coinsEarned}
                </div>
                <div className="text-[10px] text-muted-foreground">{t(lang, 'coins')}</div>
              </div>
            </div>

            {/* New badges */}
            {data.newBadges.length > 0 && (
              <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3 dark:bg-amber-950/30">
                <div className="mb-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                  {lang === 'ar' ? 'أوسمة جديدة!' : 'New badges!'}
                </div>
                {data.newBadges.map((b) => (
                  <div key={b.key} className="flex items-center gap-2 text-sm">
                    <span className="text-2xl">{b.emoji}</span>
                    <div>
                      <div className="font-bold">{b.name}</div>
                      {b.coinReward > 0 && (
                        <div className="text-xs text-amber-600">+{b.coinReward} {t(lang, 'coins')}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data.unlockedNext && (
              <div className="rounded-xl bg-emerald-100 p-2 text-center text-sm font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                🔓 {lang === 'ar' ? 'تم فتح المستوى التالي!' : 'Next level unlocked!'}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onBackToMap} className="flex-1">
            <MapIcon className="mr-1 h-4 w-4" /> {lang === 'ar' ? 'الخريطة' : 'Map'}
          </Button>
          <Button onClick={onPlayAgain} className="flex-1">
            <RotateCcw className="mr-1 h-4 w-4" /> {t(lang, 'tryAgain')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
