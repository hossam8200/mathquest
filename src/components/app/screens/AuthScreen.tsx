'use client'

// Auth / Landing screen: a full marketing landing page with hero screenshots,
// feature highlights, testimonials, and the signup/login form.
// Redesigned for conversion: stronger CTAs, visual proof, social proof.

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { useSettingsStore } from '@/store/settings-store'
import { useSound } from '@/hooks/use-sound'
import { useToast } from '@/hooks/use-toast'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Shield, Zap, Trophy, BookOpen, Sparkles, Star, Heart, Rocket,
  Gamepad2, Users, Lock, Globe, Volume2,
} from 'lucide-react'
import type { AgeBand } from '@/types'
import { cn } from '@/lib/utils'

const BANDS: { key: AgeBand; emoji: string; titleKey: 'band_8_10' | 'band_11_13' | 'band_14_16'; descKey: 'band_8_10_desc' | 'band_11_13_desc' | 'band_14_16_desc'; color: string }[] = [
  { key: '8-10', emoji: '🌈', titleKey: 'band_8_10', descKey: 'band_8_10_desc', color: 'from-rose-400 to-orange-400' },
  { key: '11-13', emoji: '🚀', titleKey: 'band_11_13', descKey: 'band_11_13_desc', color: 'from-emerald-400 to-teal-400' },
  { key: '14-16', emoji: '🎮', titleKey: 'band_14_16', descKey: 'band_14_16_desc', color: 'from-fuchsia-500 to-purple-500' },
]

const GUEST_KEY = 'mq_guest_id'

const TESTIMONIALS = [
  { emoji: '👩', name: 'Sarah M.', role: 'Parent of 9-year-old', text: 'My daughter finally loves practicing times tables! She asks to play MathQuest before bed.', stars: 5 },
  { emoji: '👨‍🏫', name: 'Mr. Ahmed K.', role: 'Math teacher, Grade 6', text: 'The spaced repetition flashcards are brilliant. My students retain facts so much better now.', stars: 5 },
  { emoji: '👨', name: 'David L.', role: 'Dad of 12-year-old twins', text: 'Both my kids compete on the leaderboard. They don\'t even realize they\'re learning!', stars: 5 },
  { emoji: '👩‍👧', name: 'Fatima R.', role: 'Mom of 10-year-old', text: 'No ads, no chat, no worries. The parent dashboard shows me exactly where my child needs help.', stars: 5 },
]

const FEATURES = [
  { icon: Gamepad2, emoji: '🎮', title: '150 Levels', desc: '5 themed worlds with boss battles', color: 'text-rose-500' },
  { icon: BookOpen, emoji: '🃏', title: 'Smart Flashcards', desc: 'Adaptive spaced repetition (SM-2)', color: 'text-emerald-500' },
  { icon: Trophy, emoji: '🏆', title: 'Leaderboards', desc: 'Global & weekly rankings', color: 'text-amber-500' },
  { icon: Sparkles, emoji: '🛒', title: '22+ Characters', desc: 'Collect, equip, and unlock perks', color: 'text-fuchsia-500' },
  { icon: Shield, emoji: '🛡️', title: '100% Safe', desc: 'No ads, no chat, no data collection', color: 'text-sky-500' },
  { icon: Globe, emoji: '🌍', title: 'Bilingual', desc: 'English + Arabic (RTL)', color: 'text-purple-500' },
]

const SCREENSHOTS = [
  { src: '/guide/06-gameplay.png', label: 'Gameplay', labelAr: 'طريقة اللعب' },
  { src: '/guide/09-marketplace.png', label: 'Characters', labelAr: 'الشخصيات' },
  { src: '/guide/15-match-game.png', label: 'Match Game', labelAr: 'لعبة المطابقة' },
  { src: '/guide/08-level-complete.png', label: 'Level Complete', labelAr: 'إكمال المستوى' },
]

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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(), password, ageBand,
          parentEmail: parentEmail.trim() || undefined,
          parentPin: parentPin.trim() || undefined,
          migrateGuestId: guestId || undefined,
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        const msg = data.error === 'NICKNAME_TAKEN' ? (lang === 'ar' ? 'الاسم مستخدم بالفعل' : 'Nickname already taken') :
                    data.error === 'INVALID_INPUT' ? (lang === 'ar' ? 'تحقق من الحقول' : 'Please check the fields') :
                    (lang === 'ar' ? 'حدث خطأ' : 'Something went wrong')
        toast({ title: msg, variant: 'destructive' })
        return
      }
      if (guestId) localStorage.removeItem(GUEST_KEY)
      sfx('levelup')
      toast({ title: lang === 'ar' ? 'تم إنشاء حسابك!' : 'Account created!' })
      setTimeout(() => window.location.reload(), 400)
    } finally { setBusy(false) }
  }

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: loginNickname.trim(), password: loginPassword }),
      })
      const data = await r.json()
      if (!r.ok) {
        const msg = data.error === 'INVALID_CREDENTIALS' ? (lang === 'ar' ? 'بيانات غير صحيحة' : 'Invalid credentials') :
                    data.error === 'GUEST_CANNOT_LOGIN' ? (lang === 'ar' ? 'سجل حساباً أولاً' : 'Please sign up first') :
                    (lang === 'ar' ? 'حدث خطأ' : 'Something went wrong')
        toast({ title: msg, variant: 'destructive' })
        return
      }
      sfx('levelup')
      const bonus = data.bonusCoins || 0
      toast({ title: lang === 'ar' ? `أهلاً بعودتك!${bonus > 0 ? ` +${bonus} عملات` : ''}` : `Welcome back!${bonus > 0 ? ` +${bonus} coins` : ''}` })
      setTimeout(() => window.location.reload(), 400)
    } finally { setBusy(false) }
  }

  async function continueAsGuest() {
    if (busy) return
    setBusy(true)
    try {
      const existingGuestId = typeof window !== 'undefined' ? localStorage.getItem(GUEST_KEY) : null
      const r = await fetch('/api/auth/guest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
    } finally { setBusy(false) }
  }

  const ar = lang === 'ar'

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-amber-50 to-emerald-100 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950">
      {/* Decorative floating shapes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[12%] text-5xl mq-float">➕</div>
        <div className="absolute right-[12%] top-[18%] text-5xl mq-float" style={{ animationDelay: '0.4s' }}>✖️</div>
        <div className="absolute left-[18%] bottom-[16%] text-5xl mq-float" style={{ animationDelay: '0.8s' }}>➗</div>
        <div className="absolute right-[18%] bottom-[12%] text-5xl mq-float" style={{ animationDelay: '1.2s' }}>➖</div>
      </div>

      {/* ─── HERO SECTION ─── */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pt-8 pb-12 md:pt-16">
        <div className="grid items-center gap-8 md:grid-cols-2">
          {/* Left: Hero copy + CTA */}
          <div className="text-center md:text-left">
            <Badge className="mb-4 bg-emerald-500 text-white hover:bg-emerald-600">
              <Shield className="mr-1 h-3 w-3" /> {ar ? 'آمن للأطفال' : 'Kid-Safe'} · {ar ? 'بدون إعلانات' : 'No Ads'}
            </Badge>
            <h1 className="text-5xl font-black tracking-tight md:text-6xl">
              <span className="mq-bounce inline-block">🦊</span>{' '}
              <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 bg-clip-text text-transparent">
                MathQuest
              </span>
            </h1>
            <p className="mt-3 text-xl font-bold text-foreground md:text-2xl">
              {ar ? 'مغامرة رياضيات ممتعة للأطفال من 8 إلى 16 سنة' : 'The math adventure kids ages 8–16 actually love'}
            </p>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              {ar
                ? 'جمع، طرح، ضرب، قسمة — عبر 150 مستوى، بطاقات تعليمية ذكية، وشخصيات قابلة للجمع'
                : 'Addition, subtraction, multiplication, division — across 150 levels, smart flashcards, and collectible characters'}
            </p>

            {/* Strong CTAs */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="text-lg font-black"
                onClick={() => {
                  sfx('click')
                  document.getElementById('auth-form')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <Rocket className="mr-2 h-5 w-5" />
                {ar ? 'ابدأ مغامرتك المجانية!' : 'Start Your Math Adventure!'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg font-bold"
                onClick={() => { sfx('click'); useAppStore.getState().go({ view: 'guide' }) }}
              >
                <BookOpen className="mr-2 h-5 w-5" />
                {ar ? 'شاهد الدليل' : 'See How It Works'}
              </Button>
            </div>

            {/* Quick stats */}
            <div className="mt-6 flex flex-wrap justify-center gap-4 md:justify-start">
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-bold">150+</span> {ar ? 'مستوى' : 'levels'}
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Sparkles className="h-4 w-4 text-fuchsia-500" />
                <span className="font-bold">22+</span> {ar ? 'شخصية' : 'characters'}
              </div>
              <div className="flex items-center gap-1 text-sm">
                <BookOpen className="h-4 w-4 text-emerald-500" />
                <span className="font-bold">490+</span> {ar ? 'بطاقة' : 'flashcards'}
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Globe className="h-4 w-4 text-sky-500" />
                <span className="font-bold">EN</span> + <span className="font-bold">ع</span>
              </div>
            </div>
          </div>

          {/* Right: Screenshot showcase */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-3">
              {SCREENSHOTS.map((ss, i) => (
                <div
                  key={ss.src}
                  className={cn(
                    'overflow-hidden rounded-2xl border-2 border-white/50 bg-white shadow-lg dark:border-white/10',
                    i === 0 && 'col-span-2'
                  )}
                >
                  <img src={ss.src} alt={ar ? ss.labelAr : ss.label} className="w-full" loading="lazy" />
                  <div className="bg-background px-2 py-1 text-center text-xs font-bold">
                    {ar ? ss.labelAr : ss.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-12">
        <h2 className="mb-6 text-center text-3xl font-black">
          {ar ? 'لماذا يحب الأطفال MathQuest؟' : 'Why Kids Love MathQuest'}
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="text-center transition hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="p-4">
                <div className="mb-2 text-3xl">{f.emoji}</div>
                <h3 className="flex items-center justify-center gap-1 text-sm font-bold">
                  <f.icon className={cn('h-4 w-4', f.color)} />
                  {f.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── AUTH FORM ─── */}
      <section id="auth-form" className="relative z-10 mx-auto max-w-md px-4 py-12">
        <Card className="shadow-xl">
          <CardHeader className="pb-3 text-center">
            <CardTitle className="text-xl">
              {ar ? 'ابدأ الآن — مجاني بالكامل!' : 'Get Started — It\'s Completely Free!'}
            </CardTitle>
            <CardDescription className="text-xs">
              {t(lang as any, 'guestNotice' as any) || (ar ? 'يتم حفظ تقدم الضيف على هذا الجهاز فقط.' : 'Guest progress saves locally. Sign up to keep it everywhere.')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signup" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signup" onClick={() => sfx('click')}>
                  <Rocket className="mr-1 h-3 w-3" /> {ar ? 'ابدأ المغامرة' : 'Start Adventure'}
                </TabsTrigger>
                <TabsTrigger value="login" onClick={() => sfx('click')}>
                  {t(lang as any, 'login' as any) || (ar ? 'تسجيل الدخول' : 'Log In')}
                </TabsTrigger>
              </TabsList>

              {/* SIGN UP */}
              <TabsContent value="signup" className="mt-4 space-y-3">
                <form onSubmit={submitSignup} className="space-y-3">
                  <div>
                    <Label htmlFor="su-nick">{t(lang as any, 'nickname' as any) || (ar ? 'الاسم المستعار' : 'Nickname')}</Label>
                    <Input id="su-nick" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} required autoFocus />
                  </div>
                  <div>
                    <Label htmlFor="su-pass">{t(lang as any, 'password' as any) || (ar ? 'كلمة المرور' : 'Password')}</Label>
                    <Input id="su-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={4} required />
                  </div>
                  <div>
                    <Label>{t(lang as any, 'pickAgeBand' as any) || (ar ? 'اختر فئة عمرك' : 'Pick your age group')}</Label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {BANDS.map((b) => (
                        <button
                          type="button" key={b.key}
                          onClick={() => { sfx('click'); setAgeBand(b.key) }}
                          className={cn(
                            'flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-center transition',
                            ageBand === b.key ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'border-border hover:border-primary/50'
                          )}
                          aria-pressed={ageBand === b.key}
                        >
                          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-xl text-white', b.color)}>
                            {b.emoji}
                          </div>
                          <span className="text-[11px] font-bold leading-tight">{t(lang as any, b.titleKey as any) || b.key}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="su-email">{t(lang as any, 'parentEmail' as any) || (ar ? 'بريد ولي الأمر (اختياري)' : 'Parent email (optional)')}</Label>
                    <Input id="su-email" type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="su-pin">{t(lang as any, 'parentPin' as any) || (ar ? 'رمز ولي الأمر (4 أرقام)' : 'Parent PIN (4 digits)')}</Label>
                    <Input id="su-pin" inputMode="numeric" pattern="\d{4}" maxLength={4} value={parentPin} onChange={(e) => setParentPin(e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <Button type="submit" className="w-full text-lg font-black" disabled={busy}>
                    <Rocket className="mr-2 h-5 w-5" />
                    {busy ? '...' : (ar ? 'ابدأ مغامرتي!' : 'Start My Adventure!')}
                  </Button>
                </form>
              </TabsContent>

              {/* LOG IN */}
              <TabsContent value="login" className="mt-4 space-y-3">
                <form onSubmit={submitLogin} className="space-y-3">
                  <div>
                    <Label htmlFor="li-nick">{t(lang as any, 'nickname' as any) || (ar ? 'الاسم المستعار' : 'Nickname')}</Label>
                    <Input id="li-nick" value={loginNickname} onChange={(e) => setLoginNickname(e.target.value)} maxLength={20} required autoFocus />
                  </div>
                  <div>
                    <Label htmlFor="li-pass">{t(lang as any, 'password' as any) || (ar ? 'كلمة المرور' : 'Password')}</Label>
                    <Input id="li-pass" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full text-lg font-black" disabled={busy}>
                    {busy ? '...' : (ar ? 'تابع المغامرة' : 'Continue Adventure')}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{ar ? 'أو' : 'or'}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button variant="outline" className="mt-3 w-full text-base font-bold" onClick={continueAsGuest} disabled={busy}>
              🎲 {ar ? 'العب كضيف — بدون تسجيل' : 'Play as Guest — No Signup'}
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* ─── SAFETY BADGES ─── */}
      <section className="relative z-10 mx-auto max-w-3xl px-4 pb-12">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-1 font-bold text-emerald-600">
            <Shield className="h-4 w-4" /> {ar ? 'بدون إعلانات' : 'No Ads'}
          </div>
          <div className="flex items-center gap-1 font-bold text-emerald-600">
            <Lock className="h-4 w-4" /> {ar ? 'بدون دردشة' : 'No Chat'}
          </div>
          <div className="flex items-center gap-1 font-bold text-emerald-600">
            <Users className="h-4 w-4" /> {ar ? 'بدون بيانات شخصية' : 'No Personal Data'}
          </div>
          <div className="flex items-center gap-1 font-bold text-emerald-600">
            <Volume2 className="h-4 w-4" /> {ar ? 'COPPA/GDPR-K' : 'COPPA/GDPR-K'}
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          {ar ? 'مصمم للأطفال. لا إعلانات، لا دردشة، لا بيانات شخصية.' : 'Made for kids. No ads, no chat, no personal data collection.'}
        </p>
        <div className="mt-4 text-center">
          <button
            onClick={() => useAppStore.getState().go({ view: 'guide' })}
            className="text-xs font-medium text-primary hover:underline"
          >
            📖 {ar ? 'عرض الدليل الكامل' : 'View full guide'}
          </button>
        </div>
      </section>
    </div>
  )
}
