'use client'

// Marketplace: grid of characters with rarity tiers, prices, perks.
// Buy with confirmation modal; equip owned characters.

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSettingsStore } from '@/store/settings-store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useSound } from '@/hooks/use-sound'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Coins, Check, Lock, Sparkles, Clock, Lightbulb } from 'lucide-react'
import { t } from '@/lib/i18n'
import type { CharacterInfo } from '@/types'
import { cn } from '@/lib/utils'

const RARITY_STYLES: Record<string, { border: string; bg: string; label: string; arLabel: string }> = {
  common:    { border: 'border-slate-300',   bg: 'from-slate-100 to-slate-200',         label: 'Common',    arLabel: 'عادي' },
  rare:      { border: 'border-sky-400',     bg: 'from-sky-100 to-cyan-200',            label: 'Rare',      arLabel: 'نادر' },
  epic:      { border: 'border-fuchsia-400', bg: 'from-fuchsia-100 to-purple-200',      label: 'Epic',      arLabel: 'ملحمي' },
  legendary: { border: 'border-amber-400',   bg: 'from-amber-100 via-yellow-200 to-orange-200', label: 'Legendary', arLabel: 'أسطوري' },
}

export function MarketplaceScreen() {
  const lang = useSettingsStore((s) => s.lang)
  const { user } = useCurrentUser()
  const sfx = useSound()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [confirm, setConfirm] = useState<CharacterInfo | null>(null)

  const { data, isLoading } = useQuery<{ characters: CharacterInfo[] }>({
    queryKey: ['marketplace'],
    queryFn: async () => {
      const r = await fetch('/api/marketplace/list', { cache: 'no-store' })
      if (!r.ok) throw new Error()
      return r.json()
    },
  })

  const buyMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch('/api/marketplace/buy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: id }),
      })
      return r.json()
    },
    onSuccess: (d) => {
      if (d.ok) {
        sfx('coin')
        toast({ title: lang === 'ar' ? 'تم الشراء!' : 'Purchased!' })
        qc.invalidateQueries({ queryKey: ['marketplace'] })
        qc.invalidateQueries({ queryKey: ['me'] })
      } else {
        const msg =
          d.error === 'INSUFFICIENT_COINS' ? (lang === 'ar' ? 'عملات غير كافية' : t(lang, 'notEnoughCoins')) :
          d.error === 'ALREADY_OWNED' ? (lang === 'ar' ? 'تمتلكه بالفعل' : 'Already owned') :
          (lang === 'ar' ? 'فشل الشراء' : 'Purchase failed')
        toast({ title: msg, variant: 'destructive' })
      }
    },
  })

  const equipMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch('/api/marketplace/equip', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: id }),
      })
      return r.json()
    },
    onSuccess: (d) => {
      if (d.ok) {
        sfx('click')
        toast({ title: lang === 'ar' ? 'تم التجهيز!' : 'Equipped!' })
        qc.invalidateQueries({ queryKey: ['marketplace'] })
        qc.invalidateQueries({ queryKey: ['me'] })
      }
    },
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-3xl font-black">
          🛒 {t(lang, 'marketplace')}
        </h1>
        <div className="flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1.5 font-bold text-yellow-700 dark:text-yellow-300">
          <Coins className="h-4 w-4" />
          {user?.coins ?? 0}
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {data?.characters.map((c) => {
          const rs = RARITY_STYLES[c.rarity] ?? RARITY_STYLES.common
          return (
            <Card key={c.id} className={cn('overflow-hidden border-2', rs.border)}>
              <div className={cn('flex items-center justify-center bg-gradient-to-br p-4 text-6xl', rs.bg)}>
                <span className="mq-float">{c.artPayload}</span>
              </div>
              <CardContent className="p-3">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="truncate text-sm font-bold">{c.name}</h3>
                  {c.equipped && <Badge className="bg-emerald-500 text-xs">{t(lang, 'equipped')}</Badge>}
                </div>
                <Badge variant="outline" className={cn('mb-2 text-[10px]', rs.border)}>
                  {lang === 'ar' ? rs.arLabel : rs.label}
                </Badge>
                <p className="mb-2 line-clamp-2 text-[11px] text-muted-foreground">{c.description}</p>
                {c.perkType && c.perkType !== 'none' && (
                  <div className="mb-2 flex items-center gap-1 text-[10px] font-bold text-primary">
                    {c.perkType === 'time' ? <Clock className="h-3 w-3" /> : <Lightbulb className="h-3 w-3" />}
                    +{c.perkValue}{c.perkType === 'time' ? 's' : ''}
                  </div>
                )}
                {c.owned ? (
                  <Button
                    size="sm"
                    variant={c.equipped ? 'secondary' : 'default'}
                    className="w-full"
                    disabled={c.equipped || equipMut.isPending}
                    onClick={() => equipMut.mutate(c.id)}
                  >
                    {c.equipped ? <><Check className="mr-1 h-3 w-3" /> {t(lang, 'equipped')}</> : t(lang, 'equip')}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => { sfx('click'); setConfirm(c) }}
                  >
                    <Coins className="mr-1 h-3 w-3" /> {c.price}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <PurchaseConfirm
        char={confirm}
        coins={user?.coins ?? 0}
        lang={lang}
        busy={buyMut.isPending}
        onConfirm={() => {
          if (confirm) buyMut.mutate(confirm.id)
          setConfirm(null)
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}

function PurchaseConfirm({
  char, coins, lang, busy, onConfirm, onCancel,
}: {
  char: CharacterInfo | null; coins: number; lang: 'en' | 'ar'
  busy: boolean; onConfirm: () => void; onCancel: () => void
}) {
  if (!char) return null
  const canAfford = coins >= char.price
  return (
    <Dialog open={!!char} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-center">
            <span className="mr-1 text-3xl">{char.artPayload}</span>
            {char.name}
          </DialogTitle>
          <DialogDescription className="text-center">{char.description}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center gap-2 py-2 text-lg font-bold">
          <Coins className="h-5 w-5 text-yellow-500" />
          {char.price}
          {!canAfford && <span className="text-destructive text-sm">({lang === 'ar' ? 'غير كافٍ' : 'not enough'})</span>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>{t(lang, 'cancel')}</Button>
          <Button onClick={onConfirm} disabled={!canAfford || busy}>
            <Sparkles className="mr-1 h-4 w-4" /> {t(lang, 'confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
