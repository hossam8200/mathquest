'use client'

// Admin panel: manage characters, view users, usage stats, CSV import.
// Restricted to role=admin.

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSettingsStore } from '@/store/settings-store'
import { useAppStore } from '@/store/app-store'
import { useSound } from '@/hooks/use-sound'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge as UiBadge } from '@/components/ui/badge'
import { ChevronLeft, Users, Package, BarChart3, FileUp } from 'lucide-react'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function AdminPanelScreen() {
  const lang = useSettingsStore((s) => s.lang)
  const go = useAppStore((s) => s.go)
  const { toast } = useToast()
  const qc = useQueryClient()
  const sfx = useSound()

  const statsQ = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const r = await fetch('/api/admin/stats', { cache: 'no-store' })
      if (!r.ok) throw new Error()
      return r.json()
    },
  })
  const usersQ = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const r = await fetch('/api/admin/users', { cache: 'no-store' })
      if (!r.ok) throw new Error()
      return r.json()
    },
  })
  const charsQ = useQuery({
    queryKey: ['admin-chars'],
    queryFn: async () => {
      const r = await fetch('/api/admin/characters', { cache: 'no-store' })
      if (!r.ok) throw new Error()
      return r.json()
    },
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-10">
      <Button variant="ghost" size="sm" onClick={() => go({ view: 'home' })} className="mb-3">
        <ChevronLeft className="mr-1 h-4 w-4" /> {t(lang, 'back')}
      </Button>
      <h1 className="mb-6 flex items-center gap-2 text-3xl font-black">
        🛡️ {t(lang, 'adminPanel')}
      </h1>

      <Tabs defaultValue="stats">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="stats"><BarChart3 className="mr-1 h-4 w-4" /> {t(lang, 'usageStats')}</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-1 h-4 w-4" /> {t(lang, 'manageUsers')}</TabsTrigger>
          <TabsTrigger value="characters"><Package className="mr-1 h-4 w-4" /> {t(lang, 'manageCharacters')}</TabsTrigger>
          <TabsTrigger value="import"><FileUp className="mr-1 h-4 w-4" /> {t(lang, 'importCsv')}</TabsTrigger>
        </TabsList>

        {/* Stats */}
        <TabsContent value="stats" className="mt-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <StatBox label={lang === 'ar' ? 'مستخدمون' : 'Users'} value={statsQ.data?.totalUsers ?? '—'} />
            <StatBox label={lang === 'ar' ? 'جولات' : 'Rounds'} value={statsQ.data?.totalRounds ?? '—'} />
            <StatBox label={lang === 'ar' ? 'جلسات دراسة' : 'Study sessions'} value={statsQ.data?.totalSessions ?? '—'} />
            <StatBox label={lang === 'ar' ? 'مشتريات' : 'Purchases'} value={statsQ.data?.totalPurchases ?? '—'} />
            <StatBox label={lang === 'ar' ? 'بطاقات' : 'Cards'} value={statsQ.data?.totalCards ?? '—'} />
            <StatBox label={lang === 'ar' ? 'مجموعات' : 'Decks'} value={statsQ.data?.totalDecks ?? '—'} />
            <StatBox label={lang === 'ar' ? 'عملات متداولة' : 'Coins in circulation'} value={statsQ.data?.coinsInCirculation ?? '—'} />
          </div>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="mt-4">
          <div className="space-y-2 max-h-96 overflow-y-auto scroll-thin">
            {usersQ.data?.users.map((u: any) => (
              <Card key={u.id}>
                <CardContent className="flex items-center justify-between p-3 text-sm">
                  <div>
                    <div className="font-bold">{u.nickname} <UiBadge variant="outline" className="ml-1 text-[9px]">{u.role}</UiBadge></div>
                    <div className="text-xs text-muted-foreground">
                      {u.ageBand} • 🪙 {u.coins} • 🔥 {u.loginStreak} • {u._count.roundResults} rounds • {u._count.purchases} buys
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Characters */}
        <TabsContent value="characters" className="mt-4">
          <CharacterEditor
            chars={charsQ.data?.characters ?? []}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ['admin-chars'] })
              qc.invalidateQueries({ queryKey: ['marketplace'] })
              sfx('click')
              toast({ title: lang === 'ar' ? 'تم الحفظ' : 'Saved' })
            }}
          />
        </TabsContent>

        {/* CSV import */}
        <TabsContent value="import" className="mt-4">
          <CsvImport onImported={() => { qc.invalidateQueries({ queryKey: ['decks'] }); toast({ title: lang === 'ar' ? 'تم الاستيراد' : 'Imported!' }) }} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <div className="text-2xl font-black">{value}</div>
        <div className="text-[10px] text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}

function CharacterEditor({ chars, onSaved }: { chars: any[]; onSaved: () => void }) {
  const lang = useSettingsStore.getState().lang
  const { toast } = useToast()
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({
    key: '', name: '', description: '', rarity: 'common', price: 50,
    artKind: 'emoji', artPayload: '🦊', perkType: 'none', perkValue: 0, enabled: true,
  })

  function edit(c: any) {
    setEditing(c)
    setForm({
      key: c.key, name: c.name, description: c.description, rarity: c.rarity,
      price: c.price, artKind: c.artKind, artPayload: c.artPayload,
      perkType: c.perkType ?? 'none', perkValue: c.perkValue ?? 0, enabled: c.enabled,
    })
  }

  function blank() {
    setEditing(null)
    setForm({ key: '', name: '', description: '', rarity: 'common', price: 50, artKind: 'emoji', artPayload: '🦊', perkType: 'none', perkValue: 0, enabled: true })
  }

  async function save() {
    const r = await fetch('/api/admin/characters', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (r.ok) { onSaved(); blank() }
    else toast({ title: 'Error', variant: 'destructive' })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg">{editing ? `Edit: ${editing.name}` : 'New character'}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Key</Label><Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} disabled={!!editing} /></div>
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="col-span-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Emoji</Label><Input value={form.artPayload} onChange={(e) => setForm({ ...form, artPayload: e.target.value })} /></div>
            <div><Label>Price</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
            <div><Label>Rarity</Label>
              <Select value={form.rarity} onValueChange={(v) => setForm({ ...form, rarity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="epic">Epic</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Perk</Label>
              <Select value={form.perkType ?? 'none'} onValueChange={(v) => setForm({ ...form, perkType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="time">+Time</SelectItem>
                  <SelectItem value="hint">+Hint</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.perkType !== 'none' && (
              <div><Label>Perk value</Label><Input type="number" value={form.perkValue} onChange={(e) => setForm({ ...form, perkValue: Number(e.target.value) })} /></div>
            )}
            <div className="col-span-2 flex items-center gap-2">
              <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
              <Label>{form.enabled ? 'Enabled' : 'Disabled'}</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={!form.key || !form.name}>Save</Button>
            <Button variant="outline" onClick={blank}>New</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {chars.map((c) => (
          <button key={c.id} onClick={() => edit(c)} className={cn('rounded-xl border-2 p-2 text-center', !c.enabled && 'opacity-50')}>
            <div className="text-3xl">{c.artPayload}</div>
            <div className="truncate text-xs font-bold">{c.name}</div>
            <div className="text-[10px] text-muted-foreground">{c.rarity} • {c.price}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function CsvImport({ onImported }: { onImported: () => void }) {
  const { toast } = useToast()
  const [deckId, setDeckId] = useState('')
  const [csv, setCsv] = useState('')
  const [decks, setDecks] = useState<any[]>([])

  // Load decks
  useState(() => {
    fetch('/api/decks').then((r) => r.json()).then((d) => setDecks(d.decks ?? []))
  })

  async function import_() {
    const r = await fetch('/api/admin/csv-import', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deckId, csv }),
    })
    const d = await r.json()
    if (r.ok) {
      toast({ title: `Imported ${d.imported} cards` })
      onImported()
      setCsv('')
    } else {
      toast({ title: d.error ?? 'Import failed', variant: 'destructive' })
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Bulk import cards (CSV)</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Deck</Label>
          <Select value={deckId} onValueChange={setDeckId}>
            <SelectTrigger><SelectValue placeholder="Select deck" /></SelectTrigger>
            <SelectContent>
              {decks.map((d) => <SelectItem key={d.id} value={d.id}>{d.coverIcon} {d.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>CSV (front,back,hint,explanation)</Label>
          <Textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder={'7 × 8,56,Think times tables,7 added 8 times\n8 × 9,72,,8 × 9 = 72'}
            rows={6}
            className="font-mono text-xs"
          />
        </div>
        <Button onClick={import_} disabled={!deckId || !csv}>Import</Button>
      </CardContent>
    </Card>
  )
}
