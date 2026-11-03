'use client'

// Collection: owned characters, equip one as avatar.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSettingsStore } from '@/store/settings-store'
import { useAppStore } from '@/store/app-store'
import { useSound } from '@/hooks/use-sound'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, ChevronLeft } from 'lucide-react'
import { t } from '@/lib/i18n'
import { avatarUrl, styleForRarity } from '@/lib/dicebear'
import type { CharacterInfo } from '@/types'
import { cn } from '@/lib/utils'

const RARITY_GRADIENT: Record<string, string> = {
  common: 'from-slate-100 to-slate-200',
  rare: 'from-sky-100 to-cyan-200',
  epic: 'from-fuchsia-100 to-purple-200',
  legendary: 'from-amber-100 via-yellow-200 to-orange-200',
}

export function CollectionScreen() {
  const lang = useSettingsStore((s) => s.lang)
  const go = useAppStore((s) => s.go)
  const sfx = useSound()
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<{ characters: CharacterInfo[] }>({
    queryKey: ['marketplace'],
    queryFn: async () => {
      const r = await fetch('/api/marketplace/list', { cache: 'no-store' })
      if (!r.ok) throw new Error()
      return r.json()
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

  const owned = data?.characters.filter((c) => c.owned) ?? []

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-10">
      <Button variant="ghost" size="sm" onClick={() => go({ view: 'home' })} className="mb-3">
        <ChevronLeft className="mr-1 h-4 w-4" /> {t(lang, 'back')}
      </Button>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-black">🎒 {t(lang, 'collection')}</h1>
        <Button variant="outline" size="sm" onClick={() => go({ view: 'marketplace' })}>
          🛒 {t(lang, 'marketplace')}
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && owned.length === 0 && (
        <p className="text-muted-foreground">
          {lang === 'ar' ? 'لا تملك شخصيات بعد. اذهب إلى المتجر!' : 'No characters yet. Visit the marketplace!'}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {owned.map((c) => (
          <Card key={c.id} className={cn('overflow-hidden', c.equipped && 'border-2 border-emerald-400')}>
            <div className={cn('flex items-center justify-center bg-gradient-to-br p-4 text-6xl', RARITY_GRADIENT[c.rarity] ?? RARITY_GRADIENT.common)}>
              <img src={avatarUrl(c.key, styleForRarity(c.rarity), 64)} alt={c.name} width={64} height={64} className="mq-float rounded-full" loading="lazy" />
            </div>
            <CardContent className="p-3">
              <h3 className="truncate text-sm font-bold">{c.name}</h3>
              <p className="mb-2 line-clamp-2 text-[11px] text-muted-foreground">{c.description}</p>
              <Button
                size="sm"
                variant={c.equipped ? 'secondary' : 'default'}
                className="w-full"
                disabled={c.equipped || equipMut.isPending}
                onClick={() => equipMut.mutate(c.id)}
              >
                {c.equipped ? <><Check className="mr-1 h-3 w-3" /> {t(lang, 'equipped')}</> : t(lang, 'equip')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
