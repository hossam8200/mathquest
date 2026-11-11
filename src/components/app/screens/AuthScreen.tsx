'use client'

// Auth / Landing screen — conversion-optimised marketing landing with:
//   • Sticky top bar (language toggle, theme toggle, log-in CTA)
//   • Hero with auto-rotating screenshots and full-width mobile CTAs
//   • "How It Works" 3-step strip
//   • Features grid
//   • 2-step signup with live nickname availability + password strength
//   • Login with show/hide password
//   • Testimonials carousel (was missing — now rendered)
//   • FAQ accordion for parents
//   • PWA install prompt
//   • Skip-to-content link, reduced-motion support, visible focus rings

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { useAppStore } from '@/store/app-store'
import { useSettingsStore } from '@/store/settings-store'
import { useSound } from '@/hooks/use-sound'
import { useToast } from '@/hooks/use-toast'
import { t, isRTL, type Lang } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  Shield, Zap, Trophy, BookOpen, Sparkles, Star, Heart, Rocket,
  Gamepad2, Users, Lock, Globe, Volume2, Sun, Moon, Eye, EyeOff,
  Check, X, Info, ChevronRight, ChevronLeft, Download, HelpCircle,
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
  { emoji: '👨', name: 'David L.', role: 'Dad of 12-year-old twins', text: "Both my kids compete on the leaderboard. They don't even realize they're learning!", stars: 5 },
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

// Floating math symbols — denser on desktop
const HERO_SYMBOLS = [
  { sym: '➕', top: '12%', left: '8%', size: 'text-5xl', delay: '0s' },
  { sym: '✖️', top: '18%', right: '12%', size: 'text-5xl', delay: '0.4s' },
  { sym: '➗', top: '70%', left: '18%', size: 'text-5xl', delay: '0.8s' },
  { sym: '➖', top: '78%', right: '18%', size: 'text-5xl', delay: '1.2s' },
  { sym: '🔢', top: '40%', left: '4%', size: 'text-3xl', delay: '1.6s', hideMobile: true },
  { sym: '⭐', top: '8%', left: '48%', size: 'text-3xl', delay: '2s', hideMobile: true },
  { sym: '🎯', top: '52%', right: '4%', size: 'text-3xl', delay: '0.6s', hideMobile: true },
  { sym: '🧮', top: '88%', left: '48%', size: 'text-3xl', delay: '1.4s', hideMobile: true },
]

// Password strength: returns 0..4 score and a label key
function scorePassword(pw: string): { score: 0 | 1 | 2 | 3 | 4; labelKey: 'passwordWeak' | 'passwordFair' | 'passwordGood' | 'passwordStrong' } {
  if (!pw) return { score: 0, labelKey: 'passwordWeak' }
  let pts = 0
  if (pw.length >= 4) pts++
  if (pw.length >= 8) pts++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) pts++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) pts++
  const score = Math.min(4, pts) as 0 | 1 | 2 | 3 | 4
  const labelKey = score <= 1 ? 'passwordWeak' : score === 2 ? 'passwordFair' : score === 3 ? 'passwordGood' : 'passwordStrong'
  return { score, labelKey }
}

const STRENGTH_COLOR = ['bg-muted', 'bg-rose-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500']

export function AuthScreen() {
  const lang = useSettingsStore((s) => s.lang)
  const setLang = useSettingsStore((s) => s.setLang)
  const darkMode = useSettingsStore((s) => s.darkMode)
  const setDarkMode = useSettingsStore((s) => s.setDarkMode)
  const sfx = useSound()
  const { toast } = useToast()

  const ar = lang === 'ar'
  const rtl = isRTL(lang)

  // ───── signup fields ─────
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [ageBand, setAgeBand] = useState<AgeBand>('8-10')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPin, setParentPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1)
  const [showSignupPw, setShowSignupPw] = useState(false)
  const [nickStatus, setNickStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'tooShort'>('idle')

  // ───── login fields ─────
  const [loginNickname, setLoginNickname] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPw, setShowLoginPw] = useState(false)

  // ───── hero carousel ─────
  const [activeShot, setActiveShot] = useState(0)

  // ───── PWA install prompt ─────
  const [installEvt, setInstallEvt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)

  // ───── active auth tab ─────
  const [authTab, setAuthTab] = useState<'signup' | 'login'>('signup')

  // ───── carousel effect ─────
  useEffect(() => {
    const id = setInterval(() => {
      setActiveShot((i) => (i + 1) % SCREENSHOTS.length)
    }, 3500)
    return () => clearInterval(id)
  }, [])

  // ───── PWA install prompt listener ─────
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setInstallEvt(e)
      // Show after small delay so it doesn't feel pushy
      setTimeout(() => setShowInstall(true), 4000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // ───── debounced nickname availability check ─────
  const nickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (nickTimer.current) clearTimeout(nickTimer.current)
    if (!nickname.trim()) { setNickStatus('idle'); return }
    if (nickname.trim().length < 2) { setNickStatus('tooShort'); return }
    setNickStatus('checking')
    nickTimer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/auth/check-nickname?nickname=${encodeURIComponent(nickname.trim())}`)
        const data = await r.json()
        setNickStatus(data.available ? 'available' : 'taken')
      } catch {
        setNickStatus('idle')
      }
    }, 400)
    return () => { if (nickTimer.current) clearTimeout(nickTimer.current) }
  }, [nickname])

  // ───── password strength ─────
  const pwScore = useMemo(() => scorePassword(password), [password])

  // ───── form handlers (unchanged logic) ─────
  async function submitSignup(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    if (nickStatus === 'taken') { toast({ title: ar ? 'الاسم مستخدم بالفعل' : 'Nickname already taken', variant: 'destructive' }); return }
    if (nickStatus === 'tooShort' || nickname.trim().length < 2) { toast({ title: ar ? 'الاسم قصير جداً' : 'Nickname too short', variant: 'destructive' }); return }
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
        const msg = data.error === 'NICKNAME_TAKEN' ? (ar ? 'الاسم مستخدم بالفعل' : 'Nickname already taken') :
                    data.error === 'INVALID_INPUT' ? (ar ? 'تحقق من الحقول' : 'Please check the fields') :
                    (ar ? 'حدث خطأ' : 'Something went wrong')
        toast({ title: msg, variant: 'destructive' })
        return
      }
      if (guestId) localStorage.removeItem(GUEST_KEY)
      sfx('levelup')
      toast({ title: ar ? 'تم إنشاء حسابك!' : 'Account created!' })
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
        const msg = data.error === 'INVALID_CREDENTIALS' ? (ar ? 'بيانات غير صحيحة' : 'Invalid credentials') :
                    data.error === 'GUEST_CANNOT_LOGIN' ? (ar ? 'سجل حساباً أولاً' : 'Please sign up first') :
                    (ar ? 'حدث خطأ' : 'Something went wrong')
        toast({ title: msg, variant: 'destructive' })
        return
      }
      sfx('levelup')
      const bonus = data.bonusCoins || 0
      toast({ title: ar ? `أهلاً بعودتك!${bonus > 0 ? ` +${bonus} عملات` : ''}` : `Welcome back!${bonus > 0 ? ` +${bonus} coins` : ''}` })
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
        toast({ title: ar ? 'تعذر الدخول كضيف' : 'Could not start guest session', variant: 'destructive' })
        return
      }
      localStorage.setItem(GUEST_KEY, data.guestId)
      sfx('click')
      toast({ title: ar ? 'مرحباً أيها الضيف!' : 'Welcome, guest!' })
      setTimeout(() => window.location.reload(), 200)
    } finally { setBusy(false) }
  }

  async function doInstall() {
    if (!installEvt) return
    installEvt.prompt()
    const choice = await installEvt.userChoice
    if (choice.outcome === 'accepted') {
      toast({ title: ar ? 'تم التثبيت!' : 'Installed!' })
    }
    setInstallEvt(null)
    setShowInstall(false)
  }

  // ───── helpers ─────
  const toggleLang = useCallback(() => {
    sfx('click')
    setLang(lang === 'en' ? 'ar' : 'en')
  }, [lang, setLang, sfx])

  const toggleTheme = useCallback(() => {
    sfx('click')
    setDarkMode(!darkMode)
  }, [darkMode, setDarkMode, sfx])

  const tr = useCallback((key: Parameters<typeof t>[1]) => t(lang, key), [lang])

  // ───── step navigation guards ─────
  const step1Valid = nickname.trim().length >= 2 && nickStatus === 'available'
  const step2Valid = password.length >= 4

  const goNextStep = () => {
    sfx('click')
    if (signupStep === 1 && step1Valid) setSignupStep(2)
    else if (signupStep === 2 && step2Valid) setSignupStep(3)
  }
  const goPrevStep = () => {
    sfx('click')
    if (signupStep > 1) setSignupStep((s) => (s - 1) as 1 | 2 | 3)
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-sky-100 via-amber-50 to-emerald-100 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950"
      dir={rtl ? 'rtl' : 'ltr'}
    >
      {/* Skip link for keyboard users */}
      <a href="#auth-form" className="mq-skip-link">
        {tr('skipToContent')}
      </a>

      {/* Decorative floating math symbols — denser on desktop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        {HERO_SYMBOLS.map((s, i) => (
          <div
            key={i}
            className={cn('mq-float mq-hero-symbol', s.size, s.hideMobile && 'hidden md:block')}
            style={{
              top: s.top,
              left: s.left,
              right: s.right,
              animationDelay: s.delay,
            }}
          >
            {s.sym}
          </div>
        ))}
      </div>

      {/* ─── STICKY TOP BAR ─── */}
      <header className="mq-landing-topbar sticky top-0 z-40 border-b border-border/40 bg-background/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
          <div className="flex items-center gap-1 text-lg font-black">
            <span className="mq-bounce inline-block">🦊</span>
            <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 bg-clip-text text-transparent">
              MathQuest
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              type="button"
              onClick={toggleLang}
              className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold transition hover:bg-accent/10"
              aria-label="Toggle language"
              title={ar ? 'English' : 'العربية'}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{lang === 'en' ? 'EN' : 'ع'}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{lang === 'en' ? 'ع' : 'EN'}</span>
            </button>
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-center rounded-lg border border-border bg-background p-1.5 transition hover:bg-accent/10"
              aria-label="Toggle dark mode"
              title={ar ? 'الوضع الليلي' : 'Dark mode'}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {/* Log In quick button */}
            <Button
              size="sm"
              variant="outline"
              className="hidden sm:inline-flex"
              onClick={() => {
                sfx('click')
                setAuthTab('login')
                document.getElementById('auth-form')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              {tr('login')}
            </Button>
          </div>
        </div>

        {/* PWA install prompt — appears only when eligible */}
        {showInstall && installEvt && (
          <div className="border-t border-border/40 bg-emerald-500/10 px-4 py-2">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-bold">
                <Download className="h-4 w-4" />
                {ar ? 'ثبّت مَث كويست على جهازك' : 'Install MathQuest on your device'}
                <span className="hidden text-xs font-normal text-muted-foreground sm:inline">
                  · {tr('installHint')}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" className="mq-install-prompt" onClick={doInstall}>
                  <Download className="mr-1 h-3 w-3" /> {tr('installApp')}
                </Button>
                <button
                  className="rounded p-1 text-muted-foreground hover:bg-background"
                  onClick={() => setShowInstall(false)}
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

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
                className="mq-hero-cta text-lg font-black"
                onClick={() => {
                  sfx('click')
                  setAuthTab('signup')
                  setSignupStep(1)
                  document.getElementById('auth-form')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <Rocket className="mr-2 h-5 w-5" />
                {ar ? 'ابدأ مغامرتك المجانية!' : 'Start Your Math Adventure!'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="mq-hero-cta text-lg font-bold"
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

          {/* Right: Auto-rotating screenshot carousel */}
          <div className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-white/50 bg-white shadow-lg dark:border-white/10">
              {SCREENSHOTS.map((ss, i) => (
                <div
                  key={ss.src}
                  className="mq-carousel-fade absolute inset-0"
                  style={{
                    opacity: i === activeShot ? 1 : 0,
                    transform: i === activeShot ? 'scale(1)' : 'scale(1.04)',
                    pointerEvents: i === activeShot ? 'auto' : 'none',
                  }}
                  aria-hidden={i !== activeShot}
                >
                  <Image
                    src={ss.src}
                    alt={ar ? ss.labelAr : ss.label}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    priority={i === 0}
                  />
                </div>
              ))}
              {/* Label + dots */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-background/85 px-3 py-1.5 backdrop-blur-sm">
                <span className="text-xs font-bold">
                  {ar ? SCREENSHOTS[activeShot].labelAr : SCREENSHOTS[activeShot].label}
                </span>
                <div className="flex gap-1">
                  {SCREENSHOTS.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { sfx('click'); setActiveShot(i) }}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        i === activeShot ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70'
                      )}
                      aria-label={`Show screenshot ${i + 1}`}
                      aria-current={i === activeShot}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Thumbnail strip — only on md+ */}
            <div className="mt-3 hidden grid-cols-4 gap-2 md:grid">
              {SCREENSHOTS.map((ss, i) => (
                <button
                  key={ss.src}
                  type="button"
                  onClick={() => { sfx('click'); setActiveShot(i) }}
                  className={cn(
                    'overflow-hidden rounded-lg border-2 transition',
                    i === activeShot ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                  aria-label={ar ? ss.labelAr : ss.label}
                >
                  <div className="relative aspect-video">
                    <Image src={ss.src} alt="" fill sizes="120px" className="object-cover" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS STRIP ─── */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 py-12">
        <h2 className="mb-8 text-center text-3xl font-black">{tr('howItWorks')}</h2>
        <div className="grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {[
            { n: 1, emoji: '🌍', titleKey: 'step1Title', descKey: 'step1Desc' as const },
            { n: 2, emoji: '🎯', titleKey: 'step2Title', descKey: 'step2Desc' as const },
            { n: 3, emoji: '🛒', titleKey: 'step3Title', descKey: 'step3Desc' as const },
          ].map((s, i, arr) => (
            <div key={s.n} className="contents">
              <Card className="text-center">
                <CardContent className="flex flex-col items-center gap-1 p-4">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-black text-primary">
                    {s.n}
                  </div>
                  <div className="text-2xl">{s.emoji}</div>
                  <h3 className="text-sm font-bold">{tr(s.titleKey as any)}</h3>
                  <p className="text-xs text-muted-foreground">{tr(s.descKey)}</p>
                </CardContent>
              </Card>
              {i < arr.length - 1 && (
                <div className="mq-step-arrow">
                  {rtl ? <ChevronLeft /> : <ChevronRight />}
                </div>
              )}
            </div>
          ))}
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

      {/* ─── AUTH FORM (2-step signup) ─── */}
      <section id="auth-form" className="relative z-10 mx-auto max-w-md px-4 py-12 scroll-mt-20">
        <Card className="shadow-xl">
          <CardHeader className="pb-3 text-center">
            <CardTitle className="text-xl">
              {ar ? 'ابدأ الآن — مجاني بالكامل!' : 'Get Started — It\'s Completely Free!'}
            </CardTitle>
            <CardDescription className="text-xs">
              {tr('guestNotice')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={authTab} onValueChange={(v) => { setAuthTab(v as 'signup' | 'login'); sfx('click') }} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signup">
                  <Rocket className="mr-1 h-3 w-3" /> {ar ? 'ابدأ المغامرة' : 'Start Adventure'}
                </TabsTrigger>
                <TabsTrigger value="login">
                  {tr('login')}
                </TabsTrigger>
              </TabsList>

              {/* ───── SIGNUP (multi-step) ───── */}
              <TabsContent value="signup" className="mt-4">
                {/* Step indicator */}
                <div className="mb-4 flex items-center justify-center gap-1">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center">
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition',
                          signupStep >= n
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {signupStep > n ? <Check className="h-3 w-3" /> : n}
                      </div>
                      {n < 3 && (
                        <div className={cn('h-0.5 w-6', signupStep > n ? 'bg-primary' : 'bg-muted')} />
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={(e) => { if (signupStep < 3) { e.preventDefault(); goNextStep() } else submitSignup(e) }} className="space-y-3">
                  {/* Step 1 — About You */}
                  {signupStep === 1 && (
                    <div className="space-y-3">
                      <div className="text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {tr('step1Heading')}
                      </div>
                      <div>
                        <Label htmlFor="su-nick">{tr('nickname')}</Label>
                        <div className="relative">
                          <Input
                            id="su-nick"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            maxLength={20}
                            required
                            autoFocus
                            autoComplete="username"
                            className={cn(
                              nickStatus === 'available' && 'border-emerald-500 pr-9',
                              nickStatus === 'taken' && 'border-rose-500 pr-9',
                              nickStatus === 'tooShort' && 'border-amber-500 pr-9',
                            )}
                          />
                          {/* Status icon */}
                          {nickStatus !== 'idle' && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2" style={{ [rtl ? 'left' : 'right']: '8px', [rtl ? 'right' : 'left']: 'auto' } as any}>
                              {nickStatus === 'checking' && (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                              )}
                              {nickStatus === 'available' && <Check className="h-4 w-4 text-emerald-500" />}
                              {nickStatus === 'taken' && <X className="h-4 w-4 text-rose-500" />}
                              {nickStatus === 'tooShort' && <Info className="h-4 w-4 text-amber-500" />}
                            </div>
                          )}
                        </div>
                        {/* Inline helper text */}
                        {nickStatus === 'tooShort' && (
                          <p className="mt-1 text-xs text-amber-600">{tr('nicknameTooShort')}</p>
                        )}
                        {nickStatus === 'available' && (
                          <p className="mt-1 text-xs text-emerald-600">{tr('nicknameAvailable')}</p>
                        )}
                        {nickStatus === 'taken' && (
                          <p className="mt-1 text-xs text-rose-600">{tr('nicknameTaken')}</p>
                        )}
                      </div>
                      <div>
                        <Label>{tr('pickAgeBand')}</Label>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {BANDS.map((b) => (
                            <button
                              type="button"
                              key={b.key}
                              onClick={() => { sfx('click'); setAgeBand(b.key) }}
                              className={cn(
                                'flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-center transition focus-visible:ring-2 focus-visible:ring-primary/40',
                                ageBand === b.key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                              )}
                              aria-pressed={ageBand === b.key}
                            >
                              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-xl text-white', b.color)}>
                                {b.emoji}
                              </div>
                              <span className="text-[11px] font-bold leading-tight">{tr(b.titleKey as any)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full text-base font-black"
                        disabled={!step1Valid}
                      >
                        {tr('nextStep')}
                        {rtl ? <ChevronLeft className="ml-1 h-4 w-4" /> : <ChevronRight className="ml-1 h-4 w-4" />}
                      </Button>
                    </div>
                  )}

                  {/* Step 2 — Password */}
                  {signupStep === 2 && (
                    <div className="space-y-3">
                      <div className="text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {tr('step2Heading')}
                      </div>
                      <div>
                        <Label htmlFor="su-pass">{tr('password')}</Label>
                        <div className="relative">
                          <Input
                            id="su-pass"
                            type={showSignupPw ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={4}
                            required
                            autoFocus
                            autoComplete="new-password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => { sfx('click'); setShowSignupPw((v) => !v) }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                            aria-label={showSignupPw ? tr('hidePassword') : tr('showPassword')}
                            title={showSignupPw ? tr('hidePassword') : tr('showPassword')}
                          >
                            {showSignupPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {/* Password strength meter */}
                        {password && (
                          <div className="mt-2">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4].map((n) => (
                                <div
                                  key={n}
                                  className={cn(
                                    'h-1.5 flex-1 rounded-full transition-all',
                                    pwScore.score >= n ? STRENGTH_COLOR[n] : 'bg-muted'
                                  )}
                                />
                              ))}
                            </div>
                            <p className="mt-1 text-xs font-medium" style={{
                              color: pwScore.score <= 1 ? 'oklch(0.62 0.24 18)' :
                                     pwScore.score === 2 ? 'oklch(0.75 0.18 70)' :
                                     pwScore.score === 3 ? 'oklch(0.72 0.18 145)' :
                                     'oklch(0.65 0.20 145)'
                            }}>
                              {tr(pwScore.labelKey)}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={goPrevStep} className="flex-1">
                          {rtl ? <ChevronRight className="mr-1 h-4 w-4" /> : <ChevronLeft className="mr-1 h-4 w-4" />}
                          {tr('backStep')}
                        </Button>
                        <Button type="submit" className="flex-1" disabled={!step2Valid}>
                          {tr('nextStep')}
                          {rtl ? <ChevronLeft className="ml-1 h-4 w-4" /> : <ChevronRight className="ml-1 h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3 — Optional parent info */}
                  {signupStep === 3 && (
                    <div className="space-y-3">
                      <div className="text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {tr('step3Heading')}
                      </div>
                      <p className="text-center text-xs text-muted-foreground">{tr('parentOptionalHint')}</p>
                      <div>
                        <Label htmlFor="su-email">{tr('parentEmail')}</Label>
                        <Input
                          id="su-email"
                          type="email"
                          value={parentEmail}
                          onChange={(e) => setParentEmail(e.target.value)}
                          autoComplete="email"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="su-pin">{tr('parentPin')}</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                aria-label={tr('pinWhatFor')}
                              >
                                <HelpCircle className="h-3 w-3" /> {tr('pinWhatFor')}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <p className="text-xs">{tr('pinExplanation')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="su-pin"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          pattern="\d{4}"
                          maxLength={4}
                          value={parentPin}
                          onChange={(e) => setParentPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={goPrevStep} className="flex-1">
                          {rtl ? <ChevronRight className="mr-1 h-4 w-4" /> : <ChevronLeft className="mr-1 h-4 w-4" />}
                          {tr('backStep')}
                        </Button>
                        <Button type="submit" className="flex-[2] text-base font-black" disabled={busy}>
                          <Rocket className="mr-2 h-5 w-5" />
                          {busy ? '...' : (ar ? 'ابدأ مغامرتي!' : 'Start My Adventure!')}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </TabsContent>

              {/* ───── LOGIN ───── */}
              <TabsContent value="login" className="mt-4 space-y-3">
                <form onSubmit={submitLogin} className="space-y-3">
                  <div>
                    <Label htmlFor="li-nick">{tr('nickname')}</Label>
                    <Input
                      id="li-nick"
                      value={loginNickname}
                      onChange={(e) => setLoginNickname(e.target.value)}
                      maxLength={20}
                      required
                      autoFocus
                      autoComplete="username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="li-pass">{tr('password')}</Label>
                    <div className="relative">
                      <Input
                        id="li-pass"
                        type={showLoginPw ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => { sfx('click'); setShowLoginPw((v) => !v) }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                        aria-label={showLoginPw ? tr('hidePassword') : tr('showPassword')}
                        title={showLoginPw ? tr('hidePassword') : tr('showPassword')}
                      >
                        {showLoginPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
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

            {/* Switch between signup/login */}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              {authTab === 'signup' ? (
                <button type="button" className="font-bold text-primary hover:underline" onClick={() => setAuthTab('login')}>
                  {tr('loginInstead')}
                </button>
              ) : (
                <button type="button" className="font-bold text-primary hover:underline" onClick={() => setAuthTab('signup')}>
                  {tr('signupInstead')}
                </button>
              )}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-12">
        <h2 className="mb-2 text-center text-3xl font-black">
          {ar ? 'ماذا يقول الآباء والمعلمون؟' : 'What Parents & Teachers Say'}
        </h2>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          {ar ? 'انضم إلى' : 'Join'} <span className="font-bold text-foreground">1,200+</span> {ar ? 'عائلة شابة' : 'families'} {ar ? 'تستخدم مَث كويست' : 'using MathQuest'}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {TESTIMONIALS.map((tm) => (
            <Card key={tm.name} className="mq-testimonial">
              <CardContent className="p-5">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-xl">
                    {tm.emoji}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{tm.name}</div>
                    <div className="text-xs text-muted-foreground">{ar ? tm.role.replace('Parent of', 'ولي أمر طفل').replace('Math teacher', 'مدرس رياضيات').replace('Dad of', 'أب لطفلين').replace('Mom of', 'أم لطفل') : tm.role}</div>
                  </div>
                  <div className="ml-auto flex">
                    {Array.from({ length: tm.stars }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-sm leading-relaxed">"{tm.text}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── FAQ ACCORDION ─── */}
      <section className="relative z-10 mx-auto max-w-3xl px-4 py-12">
        <h2 className="mb-6 text-center text-3xl font-black">{tr('faqTitle')}</h2>
        <Accordion type="single" collapsible className="w-full">
          {(['faq1Q', 'faq2Q', 'faq3Q', 'faq4Q', 'faq5Q', 'faq6Q'] as const).map((qKey, i) => {
            const aKey = (`faq${i + 1}A`) as 'faq1A' | 'faq2A' | 'faq3A' | 'faq4A' | 'faq5A' | 'faq6A'
            return (
              <AccordionItem key={qKey} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-sm font-bold">
                  {tr(qKey)}
                </AccordionTrigger>
                <AccordionContent data-accordion-content className="text-sm text-muted-foreground">
                  {tr(aKey)}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
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
          {tr('madeForKids')}
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
