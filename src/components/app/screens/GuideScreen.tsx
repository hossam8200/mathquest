'use client'

// Bilingual (EN + AR) visual guide to all MathQuest features.
// Shows screenshots with descriptions in both languages.
// Accessible from the header "Guide" button or the sidebar.

import { useState } from 'react'
import { useSettingsStore } from '@/store/settings-store'
import { useAppStore } from '@/store/app-store'
import { useSound } from '@/hooks/use-sound'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, BookOpen, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Section {
  id: string
  image: string
  en: { title: string; desc: string }
  ar: { title: string; desc: string }
}

const SECTIONS: Section[] = [
  {
    id: 'auth',
    image: '/guide/01-auth.png',
    en: { title: 'Sign Up & Login', desc: 'Create a child account with a nickname and password, pick your age group (8-10, 11-13, 14-16), and optionally add a parent email + 4-digit PIN. You can also "Play as guest" — progress saves locally and can be migrated when you sign up.' },
    ar: { title: 'التسجيل والدخول', desc: 'أنشئ حساب طفل باسم مستعار وكلمة مرور، واختر فئة عمرك (8-10، 11-13، 14-16)، وأضف اختياريًا بريد ولي الأمر ورقم سري من 4 أرقام. يمكنك أيضاً "العب كضيف" — يتم حفظ التقدم محليًا ويمكن نقله عند التسجيل.' },
  },
  {
    id: 'home',
    image: '/guide/02-home.png',
    en: { title: 'Home Dashboard', desc: 'See your coins, streak, total points, and levels completed at a glance. Quick-pick any operation (➕➖✖️➗🎲) or hit the big "Play" button to start your quest. The mascot reacts to your progress!' },
    ar: { title: 'الصفحة الرئيسية', desc: 'شاهد عملاتك وتتابعك وإجمالي نقاطك والمستويات المكتملة بنظرة واحدة. اختر أي عملية (➕➖✖️➗🎲) أو اضغط زر "العب" الكبير لبدء مغامرتك. التميمة تتفاعل مع تقدمك!' },
  },
  {
    id: 'worlds',
    image: '/guide/03-worlds.png',
    en: { title: 'World Map', desc: 'Five themed worlds: Addition Island 🏝️, Subtraction Jungle 🌴, Multiplication Mountain ⛰️, Division Desert 🏜️, and Mixed Galaxy 🌌. Each shows your progress (levels completed / 30) and total stars earned.' },
    ar: { title: 'خريطة العوالم', desc: 'خمسة عوالم مميزة: جزيرة الجمع 🏝️، غابة الطرح 🌴، جبل الضرب ⛰️، صحراء القسمة 🏜️، ومجرة المختلط 🌌. يظهر كل عالم تقدمك (المستويات المكتملة / 30) وإجمالي النجوم.' },
  },
  {
    id: 'levels',
    image: '/guide/04-level-grid.png',
    en: { title: 'Level Grid', desc: '30 levels per world. Level 1 is always unlocked; each subsequent level unlocks when you score 70%+ on the previous. Stars (⭐⭐⭐) show your best rating. Level 30 is a Boss with 15 questions!' },
    ar: { title: 'شبكة المستويات', desc: '30 مستوى لكل عالم. المستوى الأول مفتوح دائمًا؛ كل مستوى تالي يُفتح عند تحقيق 70%+ في السابق. النجوم (⭐⭐⭐) تُظهر أفضل تقييم. المستوى 30 هو زعيم بـ 15 سؤالًا!' },
  },
  {
    id: 'pregame',
    image: '/guide/05-pregame-modal.png',
    en: { title: 'Pre-Game Setup', desc: 'Before each level, choose your question type (multiple choice or type-the-answer) and toggle the 15-second timer. Defaults adapt to your age: younger kids get MCQ + no timer, teens get typed answers + timer.' },
    ar: { title: 'إعداد ما قبل اللعب', desc: 'قبل كل مستوى، اختر نوع السؤال (اختيار من متعدد أو كتابة الإجابة) ومؤقت 15 ثانية. الإعدادات الافتراضية تتكيف مع عمرك: الأصغر سنًا يحصلون على اختيار من متعدد بدون مؤقت، والمراهقون على كتابة مع مؤقت.' },
  },
  {
    id: 'gameplay',
    image: '/guide/06-gameplay.png',
    en: { title: 'Gameplay', desc: 'Answer 10 questions per level (15 for boss). Watch the timer, build your streak 🔥, and get instant feedback. The mascot cheers correct answers and looks sad on wrong ones. Wrong answers show the correct solution with an explanation.' },
    ar: { title: 'طريقة اللعب', desc: 'أجب عن 10 أسئلة لكل مستوى (15 للزعيم). راقب المؤقت، ابنِ تتابعك 🔥، واحصل على تغذية راجعة فورية. التميمة تهلل للإجابات الصحيحة وتظهر حزينة عند الخاطئة. الإجابات الخاطئة تُظهر الحل الصحيح مع الشرح.' },
  },
  {
    id: 'feedback',
    image: '/guide/07-feedback-correct.png',
    en: { title: 'Instant Feedback', desc: 'Green banner for correct answers with a happy mascot. Red banner for wrong answers showing the correct answer and a short explanation so kids learn from mistakes.' },
    ar: { title: 'التغذية الراجعة الفورية', desc: 'لافتة خضراء للإجابات الصحيحة مع تميمة سعيدة. لافتة حمراء للإجابات الخاطئة تُظهر الإجابة الصحيحة وشرحًا قصيرًا ليتعلم الأطفال من أخطائهم.' },
  },
  {
    id: 'complete',
    image: '/guide/08-level-complete.png',
    en: { title: 'Level Complete!', desc: 'Celebrate with confetti 🎉! See your score (percentage), stars earned (1-3), points, and coins. New badges are highlighted. If you passed, the next level unlocks automatically.' },
    ar: { title: 'اكتمال المستوى!', desc: 'احتفل بالقاصد الورقي 🎉! شاهد نتيجتك (نسبة)، النجوم المكتسبة (1-3)، النقاط، والعملات. الأوسمة الجديدة مُبرزة. إذا نجحت، يُفتح المستوى التالي تلقائيًا.' },
  },
  {
    id: 'marketplace',
    image: '/guide/09-marketplace.png',
    en: { title: 'Character Marketplace', desc: 'Spend earned coins on 22+ characters across 4 rarity tiers: Common, Rare, Epic, Legendary. Each has a preview, description, and perk (+time or +hint). Guards prevent buying with insufficient coins or duplicate purchases.' },
    ar: { title: 'سوق الشخصيات', desc: 'أنفق العملات المكتسبة على أكثر من 22 شخصية عبر 4 مستويات ندرة: عادي، نادر، ملحمي، أسطوري. لكل شخصية معاينة ووصف وميزة (+وقت أو +تلميح). يمنع الشراء بعملات غير كافية أو شراء مكرر.' },
  },
  {
    id: 'collection',
    image: '/guide/10-collection.png',
    en: { title: 'My Collection', desc: 'View all owned characters and equip one as your avatar. The equipped character appears during gameplay, on flashcards, and on the leaderboard — and reacts to your answers!' },
    ar: { title: 'مجموعتي', desc: 'شاهد جميع الشخصيات المملوكة وجهّز واحدة كصورتك الرمزية. الشخصية المجهَّزة تظهر أثناء اللعب وعلى البطاقات التعليمية وفي المتصدرين — وتتفاعل مع إجاباتك!' },
  },
  {
    id: 'decks',
    image: '/guide/11-decks.png',
    en: { title: 'Flashcard Decks', desc: '17 built-in decks with ~490 cards cover all operations × age bands, plus special decks (Squares, Times Tables 6-9). Create your own custom decks too. Each deck shows mastery progress and best Match time.' },
    ar: { title: 'مجموعات البطاقات التعليمية', desc: '17 مجموعة جاهزة بحوالي 490 بطاقة تغطي جميع العمليات × الفئات العمرية، بالإضافة إلى مجموعات خاصة (المربعات، جدول 6-9). أنشئ مجموعاتك الخاصة أيضًا. كل مجموعة تُظهر تقدم الإتقان وأفضل وقت مطابقة.' },
  },
  {
    id: 'deck-detail',
    image: '/guide/12-deck-detail.png',
    en: { title: 'Deck Detail', desc: 'See mastery breakdown (New → Learning → Reviewing → Mastered), card count, and best Match time. Three actions: Learn (spaced repetition), Practice weak cards, and Match game.' },
    ar: { title: 'تفاصيل المجموعة', desc: 'شروع تفصيل الإتقان (جديد ← تعلم ← مراجعة ← متقن)، عدد البطاقات، وأفضل وقت مطابقة. ثلاث إجراءات: تعلم (التكرار المتباعد)، تدرب على البطاقات الضعيفة، ولعبة المطابقة.' },
  },
  {
    id: 'flashcard-front',
    image: '/guide/13-flashcard-front.png',
    en: { title: 'Flashcard — Question', desc: 'The front shows the question (e.g., "108 + 150"). Tap the card or press SPACE to flip. Cards are presented adaptively using spaced repetition — due cards first, new cards mixed in.' },
    ar: { title: 'البطاقة التعليمية — السؤال', desc: 'الوجه يُظهر السؤال (مثلًا "108 + 150"). اضغط البطاقة أو مسافة للقلب. تُعرض البطاقات تكيفيًا باستخدام التكرار المتباعد — البطاقات المستحقة أولاً، والجديدة ممزوجة.' },
  },
  {
    id: 'flashcard-back',
    image: '/guide/14-flashcard-back.png',
    en: { title: 'Flashcard — Answer & Rating', desc: 'The back shows the answer with an optional explanation. Rate yourself: "Got it" ✓ (correct), "Almost" (struggled but close), or "Not yet" (wrong). The SM-2 algorithm schedules the next review.' },
    ar: { title: 'البطاقة التعليمية — الإجابة والتقييم', desc: 'الخلف يُظهر الإجابة مع شرح اختياري. قيِّم نفسك: "فهمتها" ✓ (صحيح)، "تقريبًا" (صعوبة ولكن قريب)، أو "ليس بعد" (خطأ). خوارزمية SM-2 تحدد المراجعة التالية.' },
  },
  {
    id: 'match',
    image: '/guide/15-match-game.png',
    en: { title: 'Match Game', desc: 'A timed matching game: pair problems (left) with answers (right). Tap a problem then tap its answer. Rounds grow with level (6 → 8 → 12 pairs). Score = base - time penalty - mistake penalty. Best times saved per deck.' },
    ar: { title: 'لعبة المطابقة', desc: 'لعبة مطابقة موقوتة: طابق المسائل (يسار) مع الإجابات (يمين). اضغط مسألة ثم اضغط إجابتها. الجولات تكبر مع المستوى (6 ← 8 ← 12 زوجًا). النتيجة = الأساس - عقوبة الوقت - عقوبة الأخطاء. أفضل الأوقات تُحفظ لكل مجموعة.' },
  },
  {
    id: 'progress',
    image: '/guide/16-progress.png',
    en: { title: 'Progress Page', desc: 'Track total points, coins, levels completed, cards mastered, study streak, and best streak. Interactive charts show points over 7 days (line) and accuracy by operation (bar). Badge collection shows all 10 milestones.' },
    ar: { title: 'صفحة التقدم', desc: 'تابع إجمالي النقاط والعملات والمستويات المكتملة والبطاقات المتقنة وتتابع الدراسة وأفضل تتابع. مخططات تفاعلية تُظهر النقاط over 7 أيام (خطي) والدقة حسب العملية (أعمدة). مجموعة الأوسمة تُظهر جميع المراحل العشر.' },
  },
  {
    id: 'leaderboard',
    image: '/guide/17-leaderboard.png',
    en: { title: 'Leaderboard', desc: 'Compete globally and weekly! Top 20 players ranked by total points. Your row is highlighted. Only nicknames and avatars shown — no personal data.' },
    ar: { title: 'المتصدرون', desc: 'تنافس عالميًا وأسبوعيًا! أفضل 20 لاعبًا مرتبين حسب إجمالي النقاط. صفك مُبرز. تُظهر الأسماء المستعارة والصور الرمزية فقط — لا بيانات شخصية.' },
  },
  {
    id: 'daily',
    image: '/guide/18-daily.png',
    en: { title: 'Daily Challenge', desc: 'A new challenge every day (complete 3 levels, earn 150 points, review 20 cards, or win 2 Match games). Earn bonus coins! Plus a daily login bonus that grows with your streak.' },
    ar: { title: 'التحدي اليومي', desc: 'تحدٍ جديد كل يوم (أكمل 3 مستويات، اكسب 150 نقطة، راجع 20 بطاقة، أو افز في لعبتين). اكسب عملات إضافية! بالإضافة إلى مكافأة دخول يومية تنمو مع تتابعك.' },
  },
  {
    id: 'settings',
    image: '/guide/19-settings.png',
    en: { title: 'Settings', desc: 'Toggle sound 🔊, dark mode 🌙, switch between English and Arabic (full RTL support), and adjust text size (small/medium/large). All settings persist across sessions.' },
    ar: { title: 'الإعدادات', desc: 'بدّل الصوت 🔊، الوضع الليلي 🌙، التبديل بين الإنجليزية والعربية (دعم RTL كامل)، واضبط حجم النص (صغير/متوسط/كبير). جميع الإعدادات تُحفظ عبر الجلسات.' },
  },
  {
    id: 'parent-pin',
    image: '/guide/20-parent-pin.png',
    en: { title: 'Parent Zone — PIN Entry', desc: 'The parent dashboard is PIN-protected (4 digits set during signup). Enter the PIN to access the dashboard.' },
    ar: { title: 'منطقة ولي الأمر — إدخال الرمز', desc: 'لوحة ولي الأمر محمية برقم سري (4 أرقام تُعين عند التسجيل). أدخل الرمز للوصول إلى اللوحة.' },
  },
  {
    id: 'parent-dashboard',
    image: '/guide/21-parent-dashboard.png',
    en: { title: 'Parent Dashboard', desc: 'See time played today, levels completed, weak areas (lowest accuracy operations), deck mastery, weak cards, and streaks. Assign built-in decks, set daily time limits and card goals.' },
    ar: { title: 'لوحة ولي الأمر', desc: 'شاهد وقت اللعب اليوم، المستويات المكتملة، نقاط الضعف (أقل العمليات دقة)، إتقان المجموعات، البطاقات الضعيفة، والتتابعات. أسند المجموعات الجاهزة، واضبط حدود الوقت اليومي وأهداف البطاقات.' },
  },
  {
    id: 'admin',
    image: '/guide/22-admin-panel.png',
    en: { title: 'Admin Panel', desc: 'Admin-only (login as admin/admin123). View usage stats (users, rounds, sessions, purchases, cards, decks, coins in circulation). Manage characters, users, and bulk-import cards via CSV.' },
    ar: { title: 'لوحة المشرف', desc: 'للمشرف فقط (سجّل الدخول كـ admin/admin123). شاهد إحصائيات الاستخدام (المستخدمون، الجولات، الجلسات، المشتريات، البطاقات، المجموعات، العملات المتداولة). أدِر الشخصيات والمستخدمين واستورد البطاقات بكميات عبر CSV.' },
  },
]

export function GuideScreen() {
  const lang = useSettingsStore((s) => s.lang)
  const go = useAppStore((s) => s.go)
  const sfx = useSound()
  const { user } = useCurrentUser()
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => go({ view: user ? 'home' : 'home' })}
        className="mb-3"
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> {lang === 'ar' ? 'رجوع' : 'Back'}
      </Button>

      <div className="mb-8 text-center">
        <div className="text-6xl mq-float">🦊</div>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">
          {lang === 'ar' ? 'دليل MathQuest الكامل' : 'MathQuest Complete Guide'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === 'ar'
            ? 'استكشف جميع الميزات والقدرات مع لقطات شاشة وشرح ثنائي اللغة'
            : 'Explore all features and capabilities with screenshots and bilingual descriptions'}
        </p>
      </div>

      {/* Quick nav */}
      <div className="mb-6 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              sfx('click')
              setExpanded(expanded === s.id ? null : s.id)
              document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
            className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-primary/5"
          >
            {lang === 'ar' ? s.ar.title : s.en.title}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {SECTIONS.map((s, idx) => (
          <Card key={s.id} id={s.id} className={cn('overflow-hidden transition', expanded === s.id && 'ring-2 ring-primary')}>
            <div className="grid md:grid-cols-2">
              {/* Screenshot */}
              <div className="relative bg-muted p-2">
                <div className="absolute left-3 top-3 z-10 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                  {idx + 1}
                </div>
                <img
                  src={s.image}
                  alt={lang === 'ar' ? s.ar.title : s.en.title}
                  className="w-full rounded-lg border shadow-sm"
                  loading="lazy"
                />
              </div>

              {/* Description */}
              <CardContent className="flex flex-col justify-center gap-3 p-4 md:p-6">
                <div>
                  <h2 className="text-lg font-bold">{s.en.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{s.en.desc}</p>
                </div>
                <div className="border-t pt-3" dir="rtl">
                  <h2 className="text-lg font-bold">{s.ar.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{s.ar.desc}</p>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 rounded-2xl bg-gradient-to-r from-orange-400 via-rose-400 to-fuchsia-400 p-6 text-center text-white">
        <BookOpen className="mx-auto h-8 w-8" />
        <h2 className="mt-2 text-xl font-black">
          {lang === 'ar' ? 'هل أنت مستعد للبدء؟' : 'Ready to start?'}
        </h2>
        <p className="mt-1 text-sm text-white/90">
          {lang === 'ar' ? 'اضغط للعب والبدء في مغامرتك الرياضية!' : 'Click play and start your math adventure!'}
        </p>
        <Button
          className="mt-4 bg-white text-orange-600 hover:bg-white/90"
          onClick={() => { sfx('click'); go({ view: user ? 'worlds' : 'home' }) }}
        >
          {user
            ? (lang === 'ar' ? 'ابدأ اللعب!' : 'Start playing!')
            : (lang === 'ar' ? 'سجّل وابدأ!' : 'Sign up & start!')} →
        </Button>
      </div>
    </div>
  )
}
