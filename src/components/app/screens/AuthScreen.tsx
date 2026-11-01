'use client'

// Auth screen: signup / login / guest, with age-band picker.
// On success, reloads so /api/auth/me returns the new user.

import { useState } from 'react'
import { useSettingsStore } from '@/store/settings-store'
import { useSound } from '@/hooks/use-sound'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import type { AgeBand } from '@/types'
import { cn } from '@/lib/utils'

const BANDS: { key: AgeBand; emoji: string; titleKey: 'band_8_10' | 'band_11_13' | 'band_14_16'; descKey: 'band_8_10_desc' | 'band_11_13_desc' | 'band_14_16_desc'; color: string }[] = [
  { key: '8-10', emoji: '🌈', titleKey: 'band_8_10', descKey: 'band_8_10_desc', color: 'from-rose-400 to-orange-400' },
  { key: '11-13', emoji: '🚀', titleKey: 'band_11_13', descKey: 'band_11_13_desc', color: 'from-emerald-400 to-teal-400' },
  { key: '14-16', emoji: '🎮', titleKey: 'band_14_16', descKey: 'band_14_16_desc', color: 'from-fuchsia-500 to-purple-500' },
]

const GUEST_KEY = 'mq_guest_id'

export function AuthScreen() {
  const lang = useSettingsStore((s) => s.lang)
  const sfx = useSound()
  const { toast } = useToast()

  // signup fields
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [ageBand, setAgeBand] = useState<AgeBand>('8-10')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPin, setParentPin] = useState('')
  const [busy, setBusy] = useState(false)

  // login fields
  const [loginNickname, setLoginNickname] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  async function submitSignup(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const guestId = typeof window !== 'undefined' ? localStorage.getItem(GUEST_KEY) : null
      const r = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(),
          password,
          ageBand,
          parentEmail: parentEmail.trim() || undefined,
          parentPin: parentPin.trim() || undefined,
          migrateGuestId: guestId || undefined,
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        const msg =
          data.error === 'NICKNAME_TAKEN' ? (lang === 'ar' ? 'الاسم مستخدم بالفعل' : 'Nickname already taken') :
          data.error === 'INVALID_INPUT' ? (lang === 'ar' ? 'تحقق من الحقول' : 'Please check the fields') :
          (lang === 'ar' ? 'حدث خطأ' : 'Something went wrong')
        toast({ title: msg, variant: 'destructive' })
        return
      }
      if (guestId) localStorage.removeItem(GUEST_KEY)
      sfx('levelup')
      toast({ title: lang === 'ar' ? 'تم إنشاء حسابك!' : 'Account created!' })
      setTimeout(() => window.location.reload(), 400)
    } finally {
      setBusy(false)
    }
  }

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: loginNickname.trim(), password: loginPassword }),
      })
      const data = await r.json()
      if (!r.ok) {
        const msg =
          data.error === 'INVALID_CREDENTIALS' ? (lang === 'ar' ? 'بيانات غير صحيحة' : 'Invalid credentials') :
          data.error === 'GUEST_CANNOT_LOGIN' ? (lang === 'ar' ? 'سجل حساباً أولاً' : 'Please sign up first') :
          (lang === 'ar' ? 'حدث خطأ' : 'Something went wrong')
        toast({ title: msg, variant: 'destructive' })
        return
      }
      sfx('levelup')
      const bonus = data.bonusCoins || 0
      toast({
        title:
          lang === 'ar'
            ? `أهلاً بعودتك!${bonus > 0 ? ` +${bonus} عملات` : ''}`
            : `Welcome back!${bonus > 0 ? ` +${bonus} coins` : ''}`,
      })
      setTimeout(() => window.location.reload(), 400)
    } finally {
      setBusy(false)
    }
  }

  async function continueAsGuest() {
    if (busy) return
    setBusy(true)
    try {
      const existingGuestId = typeof window !== 'undefined' ? localStorage.getItem(GUEST_KEY) : null
      const r = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId: existingGuestId || undefined, ageBand }),
      })
      const data = await r.json()
      if (!r.ok) {
        toast({ title: lang === 'ar' ? 'تعذر الدخول كضيف' : 'Could not start guest session', variant: 'destructive' })
        return
      }
      localStorage.setItem(GUEST_KEY, data.guestId)
      sfx('click')
      toast({ title: lang === 'ar' ? 'مرحباً أيها الضيف!' : 'Welcome, guest!' })
      setTimeout(() => window.location.reload(), 200)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-100 via-amber-50 to-emerald-100 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950">
      {/* Decorative floating shapes */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[12%] text-5xl mq-float">➕</div>
        <div className="absolute right-[12%] top-[18%] text-5xl mq-float" style={{ animationDelay: '0.4s' }}>✖️</div>
        <div className="absolute left-[18%] bottom-[16%] text-5xl mq-float" style={{ animationDelay: '0.8s' }}>➗</div>
        <div className="absolute right-[18%] bottom-[12%] text-5xl mq-float" style={{ animationDelay: '1.2s' }}>➖</div>
        <div className="absolute left-[50%] top-[8%] text-4xl mq-float" style={{ animationDelay: '0.6s' }}>⭐</div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-10">
        {/* Logo + tagline */}
        <div className="mb-6 text-center">
          <div className="text-7xl mq-bounce">🦊</div>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-orange-600 dark:text-orange-300">
            {t(lang, 'appName')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t(lang, 'tagline')}</p>
        </div>

        <Card className="w-full shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-xl">{t(lang, 'welcomeBack')}</CardTitle>
            <CardDescription className="text-center text-xs">
              {t(lang, 'guestNotice')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signup" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signup" onClick={() => sfx('click')}>{t(lang, 'signup')}</TabsTrigger>
                <TabsTrigger value="login" onClick={() => sfx('click')}>{t(lang, 'login')}</TabsTrigger>
              </TabsList>

              {/* SIGN UP */}
              <TabsContent value="signup" className="mt-4 space-y-3">
                <form onSubmit={submitSignup} className="space-y-3">
                  <div>
                    <Label htmlFor="su-nick">{t(lang, 'nickname')}</Label>
                    <Input id="su-nick" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} required autoFocus />
                  </div>
                  <div>
                    <Label htmlFor="su-pass">{t(lang, 'password')}</Label>
                    <Input id="su-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={4} required />
                  </div>
                  <div>
                    <Label>{t(lang, 'pickAgeBand')}</Label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {BANDS.map((b) => (
                        <button
                          type="button"
                          key={b.key}
                          onClick={() => { sfx('click'); setAgeBand(b.key) }}
                          className={cn(
                            'flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-center transition',
                            ageBand === b.key
                              ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                          aria-pressed={ageBand === b.key}
                        >
                          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-xl text-white', b.color)}>
                            {b.emoji}
                          </div>
                          <span className="text-[11px] font-bold leading-tight">{t(lang, b.titleKey)}</span>
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t(lang, BANDS.find((b) => b.key === ageBand)!.descKey)}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="su-email">{t(lang, 'parentEmail')}</Label>
                    <Input id="su-email" type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="su-pin">{t(lang, 'parentPin')}</Label>
                    <Input id="su-pin" inputMode="numeric" pattern="\d{4}" maxLength={4} value={parentPin} onChange={(e) => setParentPin(e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? '...' : t(lang, 'createAccount')}
                  </Button>
                </form>
              </TabsContent>

              {/* LOG IN */}
              <TabsContent value="login" className="mt-4 space-y-3">
                <form onSubmit={submitLogin} className="space-y-3">
                  <div>
                    <Label htmlFor="li-nick">{t(lang, 'nickname')}</Label>
                    <Input id="li-nick" value={loginNickname} onChange={(e) => setLoginNickname(e.target.value)} maxLength={20} required autoFocus />
                  </div>
                  <div>
                    <Label htmlFor="li-pass">{t(lang, 'password')}</Label>
                    <Input id="li-pass" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? '...' : t(lang, 'login')}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button variant="outline" className="mt-3 w-full" onClick={continueAsGuest} disabled={busy}>
              🎲 {t(lang, 'continueGuest')}
            </Button>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          {t(lang, 'madeForKids')}
        </p>
      </div>
    </div>
  )
}
