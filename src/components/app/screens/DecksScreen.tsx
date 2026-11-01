'use client'

// Decks screen: grid of built-in + custom decks with mastery progress.
// Click a deck to open detail (learn / match / practice weak / edit).

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { useSettingsStore } from '@/store/settings-store'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useSound } from '@/hooks/use-sound'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge as UiBadge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, Plus, BookOpen, Gamepad2, Zap, Layers } from 'lucide-react'
import { t } from '@/lib/i18n'
import type { DeckInfo } from '@/types'
import { cn } from '@/lib/utils'

const OP_GRADIENTS: Record<string, string> = {
  addition: 'from-rose-400 to-orange-400',
  subtraction: 'from-emerald-400 to-teal-500',
  multiplication: 'from-amber-400 to-yellow-500',
  division: 'from-fuchsia-400 to-purple-500',
  mixed: 'from-sky-400 to-cyan-500',
}

export function DecksScreen() {
  const lang = useSettingsStore((s) => s.lang)
  const go = useAppStore((s) => s.go)
  const { user } = useCurrentUser()
  const sfx = useSound()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [selectedDeck, setSelectedDeck] = useState<DeckInfo | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading } = useQuery<{ decks: DeckInfo[] }>({
    queryKey: ['decks'],
    queryFn: async () => {
      const r = await fetch('/api/decks', { cache: 'no-store' })
      if (!r.ok) throw new Error()
      return r.json()
    },
  })

  const decks = data?.decks ?? []
  const builtin = decks.filter((d) => d.isBuiltIn)
  const custom = decks.filter((d) => d.isCustom)

  function openDeck(d: DeckInfo) {
    sfx('click')
    setSelectedDeck(d)
  }

  function startLearn(d: DeckInfo, weakOnly = false) {
    useAppStore.setState({ selectedDeckId: d.id })
    go({ view: 'flashcard-learn' })
    // Store weakOnly flag via a URL param the learn screen reads
    if (weakOnly) sessionStorage.setItem('mq-weak-only', '1')
    else sessionStorage.removeItem('mq-weak-only')
    setSelectedDeck(null)
  }

  function startMatch(d: DeckInfo) {
    useAppStore.setState({ selectedDeckId: d.id })
    go({ view: 'match-game' })
    setSelectedDeck(null)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => go({ view: 'home' })} className="mb-1">
            <ChevronLeft className="mr-1 h-4 w-4" /> {t(lang, 'back')}
          </Button>
          <h1 className="flex items-center gap-2 text-3xl font-black">
            <Layers className="h-8 w-8 text-primary" />
            {t(lang, 'flashcards')}
          </h1>
        </div>
        <Button onClick={() => { sfx('click'); setCreateOpen(true) }}>
          <Plus className="mr-1 h-4 w-4" /> {t(lang, 'newDeck')}
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {/* Built-in decks */}
      {builtin.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-bold">{lang === 'ar' ? 'مجموعات جاهزة' : 'Built-in decks'}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {builtin.map((d) => (
              <DeckCard key={d.id} deck={d} onClick={() => openDeck(d)} />
            ))}
          </div>
        </div>
      )}

      {/* Custom decks */}
      {custom.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-bold">{lang === 'ar' ? 'مجموعاتي' : 'My custom decks'}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {custom.map((d) => (
              <DeckCard key={d.id} deck={d} onClick={() => openDeck(d)} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && decks.length === 0 && (
        <p className="text-muted-foreground">
          {lang === 'ar' ? 'لا توجد مجموعات. أنشئ واحدة!' : 'No decks yet. Create one!'}
        </p>
      )}

      {/* Deck detail modal */}
      <DeckDetailModal
        deck={selectedDeck}
        onClose={() => setSelectedDeck(null)}
        onLearn={(weakOnly) => selectedDeck && startLearn(selectedDeck, weakOnly)}
        onMatch={() => selectedDeck && startMatch(selectedDeck)}
        lang={lang}
      />

      {/* Create deck modal */}
      <CreateDeckModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ['decks'] })
          toast({ title: lang === 'ar' ? 'تم إنشاء المجموعة!' : 'Deck created!' })
        }}
      />
    </div>
  )
}

function DeckCard({ deck, onClick }: { deck: DeckInfo; onClick: () => void }) {
  const lang = useSettingsStore.getState().lang
  return (
    <button onClick={onClick} className="text-left">
      <Card className="overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
        <div className={cn('flex items-center justify-center bg-gradient-to-br p-4 text-4xl', OP_GRADIENTS[deck.operation] ?? OP_GRADIENTS.mixed)}>
          <span className="mq-float">{deck.coverIcon}</span>
        </div>
        <CardContent className="p-3">
          <h3 className="truncate text-sm font-bold">{deck.title}</h3>
          <p className="mb-2 line-clamp-1 text-[11px] text-muted-foreground">{deck.description}</p>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">{deck.cardCount} {lang === 'ar' ? 'بطاقة' : 'cards'}</span>
            {deck.assignedByParent && <UiBadge className="text-[9px]">📌 {lang === 'ar' ? 'مُسند' : 'Assigned'}</UiBadge>}
          </div>
          <div className="mb-1 flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">{lang === 'ar' ? 'إتقان' : 'Mastery'}</span>
            <span className="font-bold">{deck.masteryPct ?? 0}%</span>
          </div>
          <Progress value={deck.masteryPct ?? 0} className="h-1.5" />
          {deck.bestMatchTimeSec != null && (
            <div className="mt-1 text-[10px] text-muted-foreground">
              ⏱ {lang === 'ar' ? 'أفضل وقت' : 'Best'}: {deck.bestMatchTimeSec}s
            </div>
          )}
        </CardContent>
      </Card>
    </button>
  )
}

function DeckDetailModal({
  deck, onClose, onLearn, onMatch, lang,
}: {
  deck: DeckInfo | null
  onClose: () => void
  onLearn: (weakOnly?: boolean) => void
  onMatch: () => void
  lang: 'en' | 'ar'
}) {
  if (!deck) return null
  const counts = deck.counts ?? { new: 0, learning: 0, reviewing: 0, mastered: 0 }
  return (
    <Dialog open={!!deck} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-3xl">{deck.coverIcon}</span>
            {deck.title}
          </DialogTitle>
          <DialogDescription>{deck.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{lang === 'ar' ? 'إتقان' : 'Mastery'}</span>
            <span className="font-bold">{deck.masteryPct}%</span>
          </div>
          <Progress value={deck.masteryPct} className="h-2" />
          <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
            <div className="rounded bg-muted p-1">
              <div className="font-bold text-slate-500">{counts.new}</div>
              <div className="text-muted-foreground">{lang === 'ar' ? 'جديد' : 'New'}</div>
            </div>
            <div className="rounded bg-muted p-1">
              <div className="font-bold text-amber-500">{counts.learning}</div>
              <div className="text-muted-foreground">{lang === 'ar' ? 'تعلم' : 'Learn'}</div>
            </div>
            <div className="rounded bg-muted p-1">
              <div className="font-bold text-sky-500">{counts.reviewing}</div>
              <div className="text-muted-foreground">{lang === 'ar' ? 'مراجعة' : 'Review'}</div>
            </div>
            <div className="rounded bg-muted p-1">
              <div className="font-bold text-emerald-500">{counts.mastered}</div>
              <div className="text-muted-foreground">{lang === 'ar' ? 'متقن' : 'Mastered'}</div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col gap-2">
          <Button className="w-full" onClick={() => onLearn(false)}>
            <BookOpen className="mr-1 h-4 w-4" /> {t(lang, 'learn')}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onLearn(true)} disabled={counts.learning + counts.reviewing === 0}>
              <Zap className="mr-1 h-4 w-4" /> {t(lang, 'practiceWeak')}
            </Button>
            <Button variant="outline" className="flex-1" onClick={onMatch}>
              <Gamepad2 className="mr-1 h-4 w-4" /> {t(lang, 'match')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CreateDeckModal({
  open, onClose, onCreated,
}: {
  open: boolean; onClose: () => void; onCreated: () => void
}) {
  const lang = useSettingsStore.getState().lang
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverIcon, setCoverIcon] = useState('📚')
  const [operation, setOperation] = useState('mixed')
  const [ageBand, setAgeBand] = useState('8-10')
  const [busy, setBusy] = useState(false)

  async function create() {
    if (!title.trim()) return
    setBusy(true)
    try {
      const r = await fetch('/api/decks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, coverIcon, operation, ageBand }),
      })
      if (!r.ok) throw new Error()
      onCreated()
      setTitle(''); setDescription(''); setCoverIcon('📚'); setOperation('mixed')
      onClose()
    } catch {
      toast({ title: lang === 'ar' ? 'فشل الإنشاء' : 'Could not create deck', variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{lang === 'ar' ? 'مجموعة جديدة' : 'New deck'}</DialogTitle>
          <DialogDescription>
            {lang === 'ar' ? 'أنشئ مجموعتك الخاصة من البطاقات.' : 'Create your own flashcard deck.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>{t(lang, 'title')}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
          </div>
          <div>
            <Label>{t(lang, 'description')}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} rows={2} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>{t(lang, 'coverIcon')}</Label>
              <Input value={coverIcon} onChange={(e) => setCoverIcon(e.target.value)} maxLength={4} />
            </div>
            <div>
              <Label>{lang === 'ar' ? 'عملية' : 'Operation'}</Label>
              <Select value={operation} onValueChange={setOperation}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="addition">➕</SelectItem>
                  <SelectItem value="subtraction">➖</SelectItem>
                  <SelectItem value="multiplication">✖️</SelectItem>
                  <SelectItem value="division">➗</SelectItem>
                  <SelectItem value="mixed">🎲</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{lang === 'ar' ? 'فئة' : 'Age band'}</Label>
              <Select value={ageBand} onValueChange={setAgeBand}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="8-10">8-10</SelectItem>
                  <SelectItem value="11-13">11-13</SelectItem>
                  <SelectItem value="14-16">14-16</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {lang === 'ar' ? 'يمكنك إضافة بطاقات بعد الإنشاء من شاشة المجموعة.' : 'You can add cards after creating from the deck detail screen.'}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t(lang, 'cancel')}</Button>
          <Button onClick={create} disabled={busy || !title.trim()}>{t(lang, 'save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
