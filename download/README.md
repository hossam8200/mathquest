# MathQuest 🦊 — Complete Guide / الدليل الكامل

> **A fun, kid-friendly math practice app for children aged 8 to 16.**
>
> **تطبيق ممتع وآمن لتدريب الرياضيات للأطفال من 8 إلى 16 سنة.**

---

## 🇬🇧 English

### What is MathQuest?

MathQuest is an educational web app where kids practice addition, subtraction, multiplication, and division through leveled game worlds, spaced-repetition flashcards, a matching game, and a character marketplace — all in a safe, ad-free environment with no chat, no ads, and no personal data collection.

### Features Overview (with screenshots)

| # | Feature | Screenshot |
|---|---------|-----------|
| 1 | **Sign Up & Login** — Create a child account with nickname + password, pick age band (8-10, 11-13, 14-16), optional parent email + 4-digit PIN. Guest mode saves progress locally. | ![Auth](public/guide/01-auth.png) |
| 2 | **Home Dashboard** — Coins, streak, points, levels at a glance. Quick-pick operations or hit Play. | ![Home](public/guide/02-home.png) |
| 3 | **World Map** — 5 themed worlds (Addition Island, Subtraction Jungle, Multiplication Mountain, Division Desert, Mixed Galaxy), each with 30 levels + boss. | ![Worlds](public/guide/03-worlds.png) |
| 4 | **Level Grid** — 30 levels per world. Level 1 unlocked; each next unlocks at 70%+. Stars show best rating. Level 30 = Boss (15 questions). | ![Levels](public/guide/04-level-grid.png) |
| 5 | **Pre-Game Setup** — Choose MCQ or typed answer, toggle 15s timer. Defaults adapt to age. | ![Pre-Game](public/guide/05-pregame-modal.png) |
| 6 | **Gameplay** — 10 questions per level. Timer, streak counter, mascot reactions. | ![Gameplay](public/guide/06-gameplay.png) |
| 7 | **Instant Feedback** — Green for correct, red for wrong with the correct answer + explanation. | ![Feedback](public/guide/07-feedback-correct.png) |
| 8 | **Level Complete** — Confetti, stars (1-3), points, coins, new badges, unlock notice. | ![Complete](public/guide/08-level-complete.png) |
| 9 | **Marketplace** — 22+ characters across 4 rarity tiers. Buy with coins, equip as avatar. Perks: +time, +hint. | ![Marketplace](public/guide/09-marketplace.png) |
| 10 | **My Collection** — Owned characters, equip one as avatar. | ![Collection](public/guide/10-collection.png) |
| 11 | **Flashcard Decks** — 17 built-in decks (~490 cards) + custom decks. Mastery progress shown. | ![Decks](public/guide/11-decks.png) |
| 12 | **Deck Detail** — Mastery breakdown (New→Learning→Reviewing→Mastered). Learn, Practice Weak, Match. | ![Deck Detail](public/guide/12-deck-detail.png) |
| 13 | **Flashcard — Question** — Front shows the question. Tap or press SPACE to flip. | ![Card Front](public/guide/13-flashcard-front.png) |
| 14 | **Flashcard — Answer** — Back shows answer + explanation. Rate: Got it / Almost / Not yet. | ![Card Back](public/guide/14-flashcard-back.png) |
| 15 | **Match Game** — Timed pairing of problems with answers. 6/8/12 pairs by level. | ![Match](public/guide/15-match-game.png) |
| 16 | **Progress Page** — Total stats, 7-day points chart (line), accuracy by operation (bar), badges. | ![Progress](public/guide/16-progress.png) |
| 17 | **Leaderboard** — Global + weekly rankings. Top 20, only nicknames + avatars. | ![Leaderboard](public/guide/17-leaderboard.png) |
| 18 | **Daily Challenge** — Rotating daily goal (levels/points/cards/match) with coin rewards. | ![Daily](public/guide/18-daily.png) |
| 19 | **Settings** — Sound, dark mode, English/Arabic (RTL), text size. | ![Settings](public/guide/19-settings.png) |
| 20 | **Parent Zone — PIN** — 4-digit PIN entry to access parent dashboard. | ![Parent PIN](public/guide/20-parent-pin.png) |
| 21 | **Parent Dashboard** — Time played, weak areas, deck mastery, weak cards, assign decks, daily limits. | ![Parent Dashboard](public/guide/21-parent-dashboard.png) |
| 22 | **Admin Panel** — Usage stats, user management, character CRUD, CSV import. | ![Admin](public/guide/22-admin-panel.png) |

### In-App Guide

A built-in bilingual guide is accessible from:
- The **📖 Guide** button in the top header (visible to all logged-in users)
- The **Guide** item in the sidebar navigation
- A **"View full guide"** link on the login/signup screen (visible before login)

### Test Accounts

| Role | Nickname | Password |
|------|----------|----------|
| Child (age 11-13) | `TestKid` | `password123` |
| Admin | `admin` | `admin123` |

Or sign up fresh, or play as guest.

### Tech Stack

Next.js 16 · TypeScript 5 · Tailwind CSS 4 · shadcn/ui · Prisma (SQLite) · Zustand · TanStack Query · Recharts · WebAudio

### Setup

```bash
bun install
bun run db:push
bun run prisma/seed.ts
bun run scripts/create-admin.ts
bun run dev
```

Open http://localhost:3000

---

## 🇸🇦 العربية

### ما هو MathQuest؟

MathQuest هو تطبيق ويب تعليمي يتدرب فيه الأطفال على الجمع والطرح والضرب والقسمة عبر عوالم لعبة متدرجة، وبطاقات تعليمية بالتكرار المتباعد، ولعبة مطابقة، وسوق شخصيات — كل ذلك في بيئة آمنة خالية من الإعلانات والدردشة وجمع البيانات الشخصية.

### نظرة عامة على الميزات (مع لقطات شاشة)

| # | الميزة | لقطة شاشة |
|---|--------|-----------|
| 1 | **التسجيل والدخول** — أنشئ حساب طفل باسم مستعار وكلمة مرور، اختر فئة العمر، بريد ولي الأمر اختياري + رقم سري من 4 أرقام. وضع الضيف يحفظ التقدم محليًا. | ![التسجيل](public/guide/01-auth.png) |
| 2 | **الصفحة الرئيسية** — العملات والتتابع والنقاط والمستويات بنظرة واحدة. | ![الرئيسية](public/guide/02-home.png) |
| 3 | **خريطة العوالم** — 5 عوالم مميزة (جزيرة الجمع، غابة الطرح، جبل الضرب، صحراء القسمة، مجرة المختلط)، كل منها 30 مستوى + زعيم. | ![العوالم](public/guide/03-worlds.png) |
| 4 | **شبكة المستويات** — 30 مستوى لكل عالم. المستوى الأول مفتوح؛ كل تالي يُفتح عند 70%+. النجوم تُظهر أفضل تقييم. المستوى 30 = زعيم (15 سؤال). | ![المستويات](public/guide/04-level-grid.png) |
| 5 | **إعداد ما قبل اللعب** — اختر اختيار من متعدد أو كتابة، مؤقت 15 ثانية. الإعدادات تتكيف مع العمر. | ![قبل اللعب](public/guide/05-pregame-modal.png) |
| 6 | **طريقة اللعب** — 10 أسئلة لكل مستوى. مؤقت، عداد تتابع، تفاعل التميمة. | ![اللعب](public/guide/06-gameplay.png) |
| 7 | **التغذية الراجعة الفورية** — أخضر للصحيح، أحمر للخطأ مع الإجابة الصحيحة + الشرح. | ![التغذية](public/guide/07-feedback-correct.png) |
| 8 | **اكتمال المستوى** — قاصد ورقي، نجوم (1-3)، نقاط، عملات، أوسمة جديدة، إشعار فتح. | ![الاكتمال](public/guide/08-level-complete.png) |
| 9 | **السوق** — أكثر من 22 شخصية عبر 4 مستويات ندرة. شراء بالعملات، تجهيز كصورة رمزية. مزايا: +وقت، +تلميح. | ![السوق](public/guide/09-marketplace.png) |
| 10 | **مجموعتي** — الشخصيات المملوكة، تجهيز واحدة كصورة رمزية. | ![المجموعة](public/guide/10-collection.png) |
| 11 | **مجموعات البطاقات** — 17 مجموعة جاهزة (~490 بطاقة) + مجموعات مخصصة. تقدم الإتقان ظاهر. | ![المجموعات](public/guide/11-decks.png) |
| 12 | **تفاصيل المجموعة** — تفصيل الإتقان (جديد←تعلم←مراجعة←متقن). تعلم، تدرب على الضعيف، مطابقة. | ![التفاصيل](public/guide/12-deck-detail.png) |
| 13 | **البطاقة — السؤال** — الوجه يُظهر السؤال. اضغط أو مسافة للقلب. | ![السؤال](public/guide/13-flashcard-front.png) |
| 14 | **البطاقة — الإجابة** — الخلف يُظهر الإجابة + الشرح. قيّم: فهمتها / تقريبًا / ليس بعد. | ![الإجابة](public/guide/14-flashcard-back.png) |
| 15 | **لعبة المطابقة** — مطابقة موقوتة للمسائل مع الإجابات. 6/8/12 أزواج حسب المستوى. | ![المطابقة](public/guide/15-match-game.png) |
| 16 | **صفحة التقدم** — إحصائيات إجمالية، مخطط نقاط 7 أيام (خطي)، دقة حسب العملية (أعمدة)، أوسمة. | ![التقدم](public/guide/16-progress.png) |
| 17 | **المتصدرون** — ترتيب عالمي + أسبوعي. أفضل 20، الأسماء المستعارة + الصور فقط. | ![المتصدرون](public/guide/17-leaderboard.png) |
| 18 | **التحدي اليومي** — هدف يومي متبدل (مستويات/نقاط/بطاقات/مطابقة) مع مكافآت عملات. | ![اليومي](public/guide/18-daily.png) |
| 19 | **الإعدادات** — الصوت، الوضع الليلي، الإنجليزية/العربية (RTL)، حجم النص. | ![الإعدادات](public/guide/19-settings.png) |
| 20 | **منطقة ولي الأمر — الرمز** — إدخال رقم سري من 4 أرقام للوصول إلى لوحة ولي الأمر. | ![الرمز](public/guide/20-parent-pin.png) |
| 21 | **لوحة ولي الأمر** — وقت اللعب، نقاط الضعف، إتقان المجموعات، بطاقات ضعيفة، إسناد مجموعات، حدود يومية. | ![لوحة ولي الأمر](public/guide/21-parent-dashboard.png) |
| 22 | **لوحة المشرف** — إحصائيات الاستخدام، إدارة المستخدمين، إدارة الشخصيات، استيراد CSV. | ![المشرف](public/guide/22-admin-panel.png) |

### الدليل داخل التطبيق

دليل ثنائي اللغة مدمج في التطبيق، يمكن الوصول إليه من:
- زر **📖 الدليل** في الشريط العلوي (مرئي لجميع المستخدمين المسجلين)
- عنصر **الدليل** في القائمة الجانبية
- رابط **"عرض الدليل الكامل"** على شاشة تسجيل الدخول (مرئي قبل التسجيل)

### حسابات الاختبار

| الدور | الاسم المستعار | كلمة المرور |
|-------|----------------|-------------|
| طفل (11-13 سنة) | `TestKid` | `password123` |
| مشرف | `admin` | `admin123` |

أو سجّل حسابًا جديدًا، أو العب كضيف.

### التقنيات المستخدمة

Next.js 16 · TypeScript 5 · Tailwind CSS 4 · shadcn/ui · Prisma (SQLite) · Zustand · TanStack Query · Recharts · WebAudio

### التثبيت

```bash
bun install
bun run db:push
bun run prisma/seed.ts
bun run scripts/create-admin.ts
bun run dev
```

افتح http://localhost:3000

---

## Future Improvements / تحسينات مستقبلية

1. **Multiplayer duels** — real-time head-to-head math races / مبارزات ثنائية في الوقت الفعلي
2. **Fractions & geometry** — new worlds / عوالم جديدة للكسور والأشكال الهندسية
3. **Teacher classrooms** — manage multiple students / فصول دراسية للمدرسين
4. **Word problems** — narrative-based questions / مسائل نصية
5. **Voice narration** — read questions aloud / قراءة الأسئلة بصوت عالٍ
6. **More languages** — Spanish, French, Hindi / لغات إضافية

## License

Educational project. No warranty. All characters are emoji/SVG-based (no external assets).
