'use client'

// Enhanced Admin Panel with:
// 1. Analytics dashboard with charts (user growth, DAU, popular levels/characters, coin flow)
// 2. User management with search, detail view, grant coins, reset password, ban
// 3. Character management (existing + bulk operations)
// 4. Level editor (difficulty, boss flag, question count)
// 5. Badge editor (create/edit)
// 6. Deck & card management
// 7. Settings (feature flags, announcements, bulk grant)

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
import { Badge as UiBadge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, Users, Package, BarChart3, Settings as SettingsIcon, Trophy, Layers, Zap, Coins, Ban, KeyRound, Search, Gift, Megaphone } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip } from 'recharts'
import { t } from '@/lib/i18n'
import { kidAvatar } from '@/lib/dicebear'
import { cn } from '@/lib/utils'

export function AdminPanelScreen() {
  const lang = useSettingsStore((s) => s.lang)
  const go = useAppStore((s) => s.go)

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <Button variant="ghost" size="sm" onClick={() => go({ view: 'home' })} className="mb-3">
        <ChevronLeft className="mr-1 h-4 w-4" /> {t(lang, 'back')}
      </Button>
      <h1 className="mb-6 flex items-center gap-2 text-3xl font-black">🛡️ {t(lang, 'adminPanel')}</h1>

      <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-7">
          <TabsTrigger value="dashboard"><BarChart3 className="mr-1 h-4 w-4" /> Stats</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-1 h-4 w-4" /> Users</TabsTrigger>
          <TabsTrigger value="characters"><Package className="mr-1 h-4 w-4" /> Chars</TabsTrigger>
          <TabsTrigger value="levels"><Layers className="mr-1 h-4 w-4" /> Levels</TabsTrigger>
          <TabsTrigger value="badges"><Trophy className="mr-1 h-4 w-4" /> Badges</TabsTrigger>
          <TabsTrigger value="cards"><Layers className="mr-1 h-4 w-4" /> Cards</TabsTrigger>
          <TabsTrigger value="settings"><SettingsIcon className="mr-1 h-4 w-4" /> Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4"><AnalyticsTab /></TabsContent>
        <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
        <TabsContent value="characters" className="mt-4"><CharactersTab /></TabsContent>
        <TabsContent value="levels" className="mt-4"><LevelsTab /></TabsContent>
        <TabsContent value="badges" className="mt-4"><BadgesTab /></TabsContent>
        <TabsContent value="cards" className="mt-4"><CardsTab /></TabsContent>
        <TabsContent value="settings" className="mt-4"><SettingsTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Analytics Tab ───
function AnalyticsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => { const r = await fetch('/api/admin/analytics', { cache: 'no-store' }); if (!r.ok) throw new Error(); return r.json() },
  })

  if (isLoading) return <p className="text-muted-foreground">Loading analytics…</p>
  if (!data) return null
  const s = data.summary

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        <StatBox label="Users" value={s.totalUsers} icon="👥" />
        <StatBox label="Rounds" value={s.totalRounds} icon="🎮" />
        <StatBox label="Sessions" value={s.totalSessions} icon="📚" />
        <StatBox label="Purchases" value={s.totalPurchases} icon="🛒" />
        <StatBox label="Coins" value={s.coinsInCirculation} icon="🪙" />
        <StatBox label="Banned" value={s.bannedCount} icon="🚫" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">User Growth (14 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RTooltip />
                <Line type="monotone" dataKey="count" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Daily Active Users (7 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.dau}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RTooltip />
                <Bar dataKey="count" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Most Played Levels</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.popularLevels} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="title" tick={{ fontSize: 9 }} width={100} />
                <RTooltip />
                <Bar dataKey="plays" fill="var(--chart-3)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Coin Flow (7 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.coinFlow}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RTooltip />
                <Bar dataKey="earned" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent" fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Popular characters */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Most Popular Characters</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {data.popularCharacters.map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-muted p-2">
                <span className="text-2xl">{c.emoji}</span>
                <div>
                  <div className="text-sm font-bold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.buys} buys</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Users Tab ───
function UsersTab() {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => { const r = await fetch('/api/admin/users', { cache: 'no-store' }); if (!r.ok) throw new Error(); return r.json() },
  })

  const users = (data?.users ?? []).filter((u: any) =>
    !search || u.nickname.toLowerCase().includes(search.toLowerCase()) || u.ageBand?.includes(search)
  )

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by nickname or age band…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>
      <div className="space-y-2 max-h-[500px] overflow-y-auto scroll-thin">
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {users.map((u: any) => (
          <Card key={u.id} className={cn('cursor-pointer transition hover:shadow-md', u.banned && 'opacity-50')}>
            <CardContent className="flex items-center justify-between p-3" onClick={() => setSelectedId(u.id)}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">{u.banned ? '🚫' : <img src={kidAvatar(u.nickname, 32)} alt={u.nickname} width={32} height={32} className="rounded-full" loading="lazy" />}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{u.nickname}</span>
                    <UiBadge variant="outline" className="text-[9px]">{u.role}</UiBadge>
                    {u.ageBand && <UiBadge variant="outline" className="text-[9px]">{u.ageBand}</UiBadge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    🪙 {u.coins} · 🔥 {u.loginStreak} · 🎮 {u._count.roundResults} rounds · 🛒 {u._count.purchases} buys
                  </div>
                </div>
              </div>
              <ChevronLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
      <UserDetailDialog userId={selectedId} onClose={() => setSelectedId(null)} onAction={() => qc.invalidateQueries({ queryKey: ['admin-users'] })} />
    </div>
  )
}

function UserDetailDialog({ userId, onClose, onAction }: { userId: string | null; onClose: () => void; onAction: () => void }) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [grantAmount, setGrantAmount] = useState(50)
  const [newPassword, setNewPassword] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: async () => { const r = await fetch(`/api/admin/users/${userId}`, { cache: 'no-store' }); if (!r.ok) throw new Error(); return r.json() },
    enabled: !!userId,
  })

  const grantMut = useMutation({
    mutationFn: async (amount: number) => {
      const r = await fetch(`/api/admin/users/${userId}/grant-coins`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, reason: 'admin_grant' }) })
      return r.json()
    },
    onSuccess: () => { toast({ title: 'Coins granted!' }); qc.invalidateQueries({ queryKey: ['admin-user', userId] }); onAction() },
  })

  const resetMut = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword }) })
      return r.json()
    },
    onSuccess: () => { toast({ title: 'Password reset!' }); setNewPassword('') },
  })

  const banMut = useMutation({
    mutationFn: async (banned: boolean) => {
      const r = await fetch(`/api/admin/users/${userId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ banned }) })
      return r.json()
    },
    onSuccess: () => { toast({ title: banned ? 'User banned' : 'User unbanned' }); qc.invalidateQueries({ queryKey: ['admin-user', userId] }); onAction() },
  })

  const ageMut = useMutation({
    mutationFn: async (ageBand: string) => {
      const r = await fetch(`/api/admin/users/${userId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ageBand }) })
      return r.json()
    },
    onSuccess: () => { toast({ title: 'Age band updated' }); qc.invalidateQueries({ queryKey: ['admin-user', userId] }); onAction() },
  })

  const u = data?.user
  const banned = u?.banned

  return (
    <Dialog open={!!userId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {banned ? '🚫' : '👤'} {u?.nickname}
            <UiBadge variant="outline">{u?.role}</UiBadge>
          </DialogTitle>
        </DialogHeader>
        {isLoading ? <p>Loading…</p> : u && (
          <div className="space-y-4">
            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded bg-muted p-2"><div className="text-lg font-black">{u.coins}</div><div className="text-muted-foreground">Coins</div></div>
              <div className="rounded bg-muted p-2"><div className="text-lg font-black">{u._count.roundResults}</div><div className="text-muted-foreground">Rounds</div></div>
              <div className="rounded bg-muted p-2"><div className="text-lg font-black">{u._count.badges}</div><div className="text-muted-foreground">Badges</div></div>
              <div className="rounded bg-muted p-2"><div className="text-lg font-black">{u.loginStreak}</div><div className="text-muted-foreground">Streak</div></div>
            </div>

            {/* Grant coins */}
            <div className="rounded-xl border p-3">
              <Label className="mb-2 block flex items-center gap-1"><Coins className="h-4 w-4" /> Grant Coins</Label>
              <div className="flex gap-2">
                <Input type="number" value={grantAmount} onChange={e => setGrantAmount(Number(e.target.value))} className="flex-1" />
                <Button size="sm" onClick={() => grantMut.mutate(grantAmount)} disabled={grantMut.isPending}><Gift className="mr-1 h-4 w-4" /> Grant</Button>
              </div>
              <div className="mt-2 flex gap-1">
                {[10, 50, 100, 500].map(v => <Button key={v} size="sm" variant="outline" onClick={() => setGrantAmount(v)}>{v}</Button>)}
              </div>
            </div>

            {/* Reset password */}
            <div className="rounded-xl border p-3">
              <Label className="mb-2 block flex items-center gap-1"><KeyRound className="h-4 w-4" /> Reset Password</Label>
              <div className="flex gap-2">
                <Input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" className="flex-1" />
                <Button size="sm" variant="outline" onClick={() => resetMut.mutate()} disabled={!newPassword || resetMut.isPending}>Reset</Button>
              </div>
            </div>

            {/* Change age band */}
            <div className="rounded-xl border p-3">
              <Label className="mb-2 block">Age Band</Label>
              <Select value={u.ageBand ?? '8-10'} onValueChange={(v) => ageMut.mutate(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="8-10">8-10</SelectItem>
                  <SelectItem value="11-13">11-13</SelectItem>
                  <SelectItem value="14-16">14-16</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ban / unban */}
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div className="flex items-center gap-2">
                <Ban className="h-4 w-4 text-rose-500" />
                <span className="text-sm font-bold">{banned ? 'Banned' : 'Active'}</span>
              </div>
              <Button size="sm" variant={banned ? 'default' : 'destructive'} onClick={() => banMut.mutate(!banned)} disabled={banMut.isPending}>
                {banned ? 'Unban' : 'Ban'}
              </Button>
            </div>

            {/* Recent transactions */}
            {data.recentTransactions.length > 0 && (
              <div>
                <Label className="mb-2 block">Recent Transactions</Label>
                <div className="max-h-32 space-y-1 overflow-y-auto scroll-thin">
                  {data.recentTransactions.map((t: any) => (
                    <div key={t.id} className="flex justify-between text-xs rounded bg-muted px-2 py-1">
                      <span>{t.reason}</span>
                      <span className={t.type === 'earn' ? 'text-emerald-600' : 'text-rose-600'}>{t.type === 'earn' ? '+' : '-'}{t.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Characters Tab (existing + bulk) ───
function CharactersTab() {
  const lang = useSettingsStore.getState().lang
  const { toast } = useToast()
  const qc = useQueryClient()
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ key: '', name: '', description: '', rarity: 'common', price: 50, artKind: 'emoji', artPayload: '🦊', perkType: 'none', perkValue: 0, enabled: true })

  const { data } = useQuery({
    queryKey: ['admin-chars'],
    queryFn: async () => { const r = await fetch('/api/admin/characters', { cache: 'no-store' }); if (!r.ok) throw new Error(); return r.json() },
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/admin/characters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      return r.json()
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-chars'] }); qc.invalidateQueries({ queryKey: ['marketplace'] }); toast({ title: 'Saved' }); setEditing(null) },
  })

  function edit(c: any) {
    setEditing(c)
    setForm({ key: c.key, name: c.name, description: c.description, rarity: c.rarity, price: c.price, artKind: c.artKind, artPayload: c.artPayload, perkType: c.perkType ?? 'none', perkValue: c.perkValue ?? 0, enabled: c.enabled })
  }
  function blank() { setEditing(null); setForm({ key: '', name: '', description: '', rarity: 'common', price: 50, artKind: 'emoji', artPayload: '🦊', perkType: 'none', perkValue: 0, enabled: true }) }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg">{editing ? `Edit: ${editing.name}` : 'New character'}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Key</Label><Input value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} disabled={!!editing} /></div>
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="col-span-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Emoji</Label><Input value={form.artPayload} onChange={e => setForm({ ...form, artPayload: e.target.value })} /></div>
            <div><Label>Price</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
            <div><Label>Rarity</Label><Select value={form.rarity} onValueChange={v => setForm({ ...form, rarity: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="common">Common</SelectItem><SelectItem value="rare">Rare</SelectItem><SelectItem value="epic">Epic</SelectItem><SelectItem value="legendary">Legendary</SelectItem></SelectContent></Select></div>
            <div><Label>Perk</Label><Select value={form.perkType} onValueChange={v => setForm({ ...form, perkType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="time">+Time</SelectItem><SelectItem value="hint">+Hint</SelectItem></SelectContent></Select></div>
            {form.perkType !== 'none' && <div><Label>Value</Label><Input type="number" value={form.perkValue} onChange={e => setForm({ ...form, perkValue: Number(e.target.value) })} /></div>}
            <div className="col-span-2 flex items-center gap-2"><Switch checked={form.enabled} onCheckedChange={v => setForm({ ...form, enabled: v })} /><Label>{form.enabled ? 'Enabled' : 'Disabled'}</Label></div>
          </div>
          <div className="flex gap-2"><Button onClick={() => saveMut.mutate()} disabled={!form.key || !form.name || saveMut.isPending}>Save</Button><Button variant="outline" onClick={blank}>New</Button></div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {data?.characters?.map((c: any) => (
          <button key={c.id} onClick={() => edit(c)} className={cn('rounded-xl border-2 p-2 text-center', !c.enabled && 'opacity-50')}>
            <div className="text-3xl">{c.artPayload}</div>
            <div className="truncate text-xs font-bold">{c.name}</div>
            <div className="text-[10px] text-muted-foreground">{c.rarity} · {c.price}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Levels Tab ───
function LevelsTab() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-levels'],
    queryFn: async () => { const r = await fetch('/api/admin/levels', { cache: 'no-store' }); if (!r.ok) throw new Error(); return r.json() },
  })

  const updateMut = useMutation({
    mutationFn: async (payload: any) => {
      const r = await fetch('/api/admin/levels', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      return r.json()
    },
    onSuccess: () => { toast({ title: 'Level updated' }); qc.invalidateQueries({ queryKey: ['admin-levels'] }) },
  })

  if (isLoading) return <p className="text-muted-foreground">Loading levels…</p>
  const levels = data?.levels ?? []

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto scroll-thin">
      {levels.map((l: any) => (
        <Card key={l.id}>
          <CardContent className="flex items-center gap-3 p-3">
            <span className="text-xl">{l.world.emoji}</span>
            <div className="flex-1">
              <div className="text-sm font-bold">{l.title} {l.isBoss && <UiBadge className="ml-1 text-[9px]">BOSS</UiBadge>}</div>
              <div className="text-xs text-muted-foreground">{l.world.name} · {l._count.roundResults} plays</div>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Diff</Label>
              <Select value={String(l.difficulty)} onValueChange={v => updateMut.mutate({ id: l.id, difficulty: Number(v) })}>
                <SelectTrigger className="w-16 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>{[1,2,3,4,5,6,7,8,9,10].map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}</SelectContent>
              </Select>
              <Label className="text-xs">Q</Label>
              <Input type="number" defaultValue={l.questionCount} className="w-14 h-8" onBlur={e => updateMut.mutate({ id: l.id, questionCount: Number(e.target.value) })} />
              <Switch checked={l.isBoss} onCheckedChange={v => updateMut.mutate({ id: l.id, isBoss: v })} />
              <Label className="text-xs">Boss</Label>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Badges Tab ───
function BadgesTab() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [form, setForm] = useState({ key: '', name: '', description: '', emoji: '🏅', coinReward: 20 })

  const { data } = useQuery({
    queryKey: ['admin-badges'],
    queryFn: async () => { const r = await fetch('/api/admin/badges', { cache: 'no-store' }); if (!r.ok) throw new Error(); return r.json() },
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/admin/badges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      return r.json()
    },
    onSuccess: () => { toast({ title: 'Badge saved' }); qc.invalidateQueries({ queryKey: ['admin-badges'] }); setForm({ key: '', name: '', description: '', emoji: '🏅', coinReward: 20 }) },
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg">Create / Edit Badge</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Key</Label><Input value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} /></div>
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="col-span-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Emoji</Label><Input value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} maxLength={4} /></div>
            <div><Label>Coin Reward</Label><Input type="number" value={form.coinReward} onChange={e => setForm({ ...form, coinReward: Number(e.target.value) })} /></div>
          </div>
          <Button onClick={() => saveMut.mutate()} disabled={!form.key || !form.name}>Save Badge</Button>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {data?.badges?.map((b: any) => (
          <div key={b.id} className="rounded-xl border p-2 text-center">
            <div className="text-3xl">{b.emoji}</div>
            <div className="text-xs font-bold">{b.name}</div>
            <div className="text-[10px] text-muted-foreground">+{b.coinReward} · {b._count.userBadges} earned</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Cards Tab (deck & card management) ───
function CardsTab() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null)

  const { data: decksData } = useQuery({
    queryKey: ['admin-decks'],
    queryFn: async () => { const r = await fetch('/api/decks', { cache: 'no-store' }); if (!r.ok) throw new Error(); return r.json() },
  })
  const { data: deckData } = useQuery({
    queryKey: ['deck-detail', selectedDeck],
    queryFn: async () => { const r = await fetch(`/api/decks/${selectedDeck}`, { cache: 'no-store' }); if (!r.ok) throw new Error(); return r.json() },
    enabled: !!selectedDeck,
  })

  const cardMut = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const r = await fetch(`/api/admin/cards/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      return r.json()
    },
    onSuccess: () => { toast({ title: 'Card updated' }); qc.invalidateQueries({ queryKey: ['deck-detail', selectedDeck] }) },
  })
  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/cards/${id}`, { method: 'DELETE' })
      return r.json()
    },
    onSuccess: () => { toast({ title: 'Card deleted' }); qc.invalidateQueries({ queryKey: ['deck-detail', selectedDeck] }) },
  })

  const decks = decksData?.decks ?? []

  return (
    <div className="space-y-3">
      {!selectedDeck ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Select a deck to manage its cards:</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {decks.map((d: any) => (
              <button key={d.id} onClick={() => setSelectedDeck(d.id)} className="rounded-xl border p-3 text-left hover:bg-muted">
                <div className="text-2xl">{d.coverIcon}</div>
                <div className="text-sm font-bold">{d.title}</div>
                <div className="text-xs text-muted-foreground">{d.cardCount} cards</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setSelectedDeck(null)} className="mb-3">← Back to decks</Button>
          <h3 className="mb-3 text-lg font-bold">{deckData?.deck?.title}</h3>
          <div className="space-y-1 max-h-[500px] overflow-y-auto scroll-thin">
            {deckData?.cards?.map((c: any) => (
              <div key={c.id} className="flex items-center gap-2 rounded-lg border p-2">
                <Input defaultValue={c.front} className="flex-1 h-8" onBlur={e => cardMut.mutate({ id: c.id, front: e.target.value })} />
                <span className="text-muted-foreground">=</span>
                <Input defaultValue={c.back} className="w-20 h-8" onBlur={e => cardMut.mutate({ id: c.id, back: e.target.value })} />
                <Button size="sm" variant="ghost" onClick={() => delMut.mutate(c.id)}>🗑️</Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Settings Tab (feature flags, announcements, bulk grant) ───
function SettingsTab() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [announcement, setAnnouncement] = useState('')
  const [bulkAmount, setBulkAmount] = useState(50)

  const { data } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => { const r = await fetch('/api/admin/settings', { cache: 'no-store' }); if (!r.ok) throw new Error(); return r.json() },
  })

  // Update local state when data loads
  if (data && announcement === '' && data.settings.announcement) {
    setAnnouncement(data.settings.announcement)
  }

  const saveSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const r = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) })
      return r.json()
    },
    onSuccess: () => { toast({ title: 'Setting saved' }); qc.invalidateQueries({ queryKey: ['admin-settings'] }) },
  })

  const bulkMut = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/admin/bulk-grant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: bulkAmount, reason: 'admin_bulk' }) })
      return r.json()
    },
    onSuccess: (d) => { toast({ title: `Granted ${bulkAmount} coins to ${d.count} users!` }); qc.invalidateQueries({ queryKey: ['admin-users'] }) },
  })

  const settings = data?.settings
  const flags = [
    { key: 'marketplace_enabled', label: 'Marketplace', value: settings?.marketplace_enabled !== 'false' },
    { key: 'match_game_enabled', label: 'Match Game', value: settings?.match_game_enabled !== 'false' },
    { key: 'leaderboard_enabled', label: 'Leaderboard', value: settings?.leaderboard_enabled !== 'false' },
    { key: 'daily_challenge_enabled', label: 'Daily Challenge', value: settings?.daily_challenge_enabled !== 'false' },
    { key: 'maintenance_mode', label: 'Maintenance Mode', value: settings?.maintenance_mode === 'true' },
  ]

  return (
    <div className="space-y-4">
      {/* Announcement */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Megaphone className="h-5 w-5" /> Announcement Banner</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Textarea value={announcement} onChange={e => setAnnouncement(e.target.value)} placeholder="Post a message all users will see on login…" rows={2} />
          <Button size="sm" onClick={() => saveSetting.mutate({ key: 'announcement', value: announcement })} disabled={saveSetting.isPending}>Save Announcement</Button>
          {announcement && <Button size="sm" variant="outline" onClick={() => { setAnnouncement(''); saveSetting.mutate({ key: 'announcement', value: '' }) }}>Clear</Button>}
        </CardContent>
      </Card>

      {/* Feature flags */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Feature Flags</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {flags.map(f => (
            <div key={f.key} className="flex items-center justify-between rounded-lg border p-2">
              <span className="text-sm font-bold">{f.label}</span>
              <Switch checked={f.value} onCheckedChange={v => saveSetting.mutate({ key: f.key, value: String(v) })} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bulk grant */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Gift className="h-5 w-5" /> Bulk Grant Coins</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">Grant coins to ALL active users (e.g., holiday gift).</p>
          <div className="flex gap-2">
            <Input type="number" value={bulkAmount} onChange={e => setBulkAmount(Number(e.target.value))} className="flex-1" />
            <Button onClick={() => bulkMut.mutate()} disabled={bulkMut.isPending}><Coins className="mr-1 h-4 w-4" /> Grant to All</Button>
          </div>
        </CardContent>
      </Card>

      {/* CSV import */}
      <Card>
        <CardHeader><CardTitle className="text-lg">CSV Card Import</CardTitle></CardHeader>
        <CardContent>
          <CsvImport onImported={() => { qc.invalidateQueries({ queryKey: ['admin-decks'] }); toast({ title: 'Imported!' }) }} />
        </CardContent>
      </Card>
    </div>
  )
}

function CsvImport({ onImported }: { onImported: () => void }) {
  const { toast } = useToast()
  const [deckId, setDeckId] = useState('')
  const [csv, setCsv] = useState('')
  const [decks, setDecks] = useState<any[]>([])
  if (typeof window !== 'undefined' && decks.length === 0) {
    fetch('/api/decks').then(r => r.json()).then(d => setDecks(d.decks ?? [])).catch(() => {})
  }
  async function import_() {
    const r = await fetch('/api/admin/csv-import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deckId, csv }) })
    const d = await r.json()
    if (r.ok) { toast({ title: `Imported ${d.imported} cards` }); onImported(); setCsv('') }
    else toast({ title: d.error ?? 'Import failed', variant: 'destructive' })
  }
  return (
    <div className="space-y-2">
      <Select value={deckId} onValueChange={setDeckId}>
        <SelectTrigger><SelectValue placeholder="Select deck" /></SelectTrigger>
        <SelectContent>{decks.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.coverIcon} {d.title}</SelectItem>)}</SelectContent>
      </Select>
      <Textarea value={csv} onChange={e => setCsv(e.target.value)} placeholder={'7 × 8,56,Think times tables,7 added 8 times\n8 × 9,72,,8 × 9 = 72'} rows={4} className="font-mono text-xs" />
      <Button size="sm" onClick={import_} disabled={!deckId || !csv}>Import</Button>
    </div>
  )
}

function StatBox({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <Card><CardContent className="p-3 text-center">
      <div className="text-xl">{icon}</div>
      <div className="text-lg font-black">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </CardContent></Card>
  )
}
