# MathQuest 🦊

A fun, kid-friendly math practice web app for children aged 8 to 16. Practice addition, subtraction, multiplication, and division through leveled worlds, flashcards with spaced repetition, a matching game, and a character marketplace — all in a safe, ad-free environment.

## Features

### Gameplay
- **5 worlds** (Addition Island, Subtraction Jungle, Multiplication Mountain, Division Desert, Mixed Galaxy), each with **30 levels** + a boss level
- **Adaptive difficulty** per age band (8-10, 11-13, 14-16): younger kids get single/double digits; teens get negatives, decimals, and multi-step expressions
- **Two question modes**: multiple choice or type-the-answer
- **Optional timer** per question (15s base + character perks)
- **Immediate feedback** with mascot reactions, sounds, and explanations for wrong answers
- **Star ratings** (1-3 stars based on accuracy), points, and coins
- **Server-side validation** — answers are re-checked on the server; the client never self-reports scores

### Flashcards & Spaced Repetition
- **17 built-in decks** (~490 cards) covering all 4 operations across 3 age bands + special decks (Squares, Times Tables 6-9)
- **Custom decks** — create, edit, duplicate, delete your own
- **Learn mode** with simplified SM-2 spaced repetition: cards you miss return sooner, mastered cards later
- **3D flip animation** — tap or press space to flip
- **Self-rating**: Got it / Almost / Not yet
- **Session summary**: cards reviewed, new cards learned, cards to review again

### Match Game
- Timed pairing of problems with answers
- Rounds grow with level (6 → 8 → 12 pairs)
- Score based on speed and mistakes
- Best times saved per deck

### Marketplace & Characters
- **22+ starter characters** across 4 rarity tiers (Common, Rare, Epic, Legendary)
- Buy with earned coins (virtual currency only, no real money)
- **Character perks**: +time or +hint during gameplay
- Equip a character as your avatar — shown during gameplay, on flashcards, and on leaderboards
- Mascot reacts to answers (cheer, celebrate, look sad)
- Guards: insufficient coins, duplicate purchases, confirmation modal

### Progress & Rewards
- **Points** per correct answer + speed/streak/perfect-round bonuses
- **Coins** from points → spend in marketplace
- **Daily login bonus** (grows with streak)
- **Daily challenge** (rotating: levels, points, cards, match) with claimable coin rewards
- **Study streaks** with streak freezes (purchasable)
- **10 milestone badges** (First Steps, Flawless, Boss Slayer, Week Warrior, etc.)
- **Progress page** with charts (points over time, accuracy by operation) and badge collection
- **Leaderboards** (global + weekly)

### Parent Dashboard (PIN-protected)
- Time played today
- Levels completed, accuracy by operation, weak areas
- Per-deck mastery progress
- Weak cards list
- Streak history
- Assign built-in decks to the child
- Set daily time limit and card goal

### Admin Panel
- Usage statistics (users, rounds, sessions, purchases, coins in circulation)
- Manage users (view all)
- Manage characters (add, edit, price, rarity, enable/disable)
- Bulk import cards via CSV

### Safety & Accessibility
- **No chat, no ads, no external links, no personal data collection**
- COPPA/GDPR-K principles followed
- **Guest mode** — play without an account; migrate progress on sign-up
- **Dark mode** toggle
- **English + Arabic** with full RTL support
- **Adjustable text size** (small / medium / large)
- **Keyboard navigation** (spacebar to flip flashcards)
- **Responsive** — works on phones, tablets, and desktops

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | Prisma ORM + SQLite (PostgreSQL-ready) |
| State | Zustand (client) + TanStack Query (server) |
| Charts | Recharts |
| Sounds | WebAudio API (synthesized, no asset files) |
| Auth | Cookie-based sessions with scrypt password hashing |

## Getting Started

### Prerequisites
- Node.js 18+ or [Bun](https://bun.sh)
- SQLite (included; no separate install needed)

### Installation

```bash
# Clone or copy the project
cd mathquest

# Install dependencies
bun install   # or: npm install

# Set up the database
cp .env.example .env   # if not already present
bun run db:push        # creates SQLite DB + generates Prisma client

# Seed starter data (worlds, levels, characters, badges, built-in decks)
bun run prisma/seed.ts

# Create an admin account (optional)
bun run scripts/create-admin.ts
# → Admin login: admin / admin123
```

### Running the dev server

```bash
bun run dev
```

Open http://localhost:3000 in your browser.

### Test accounts

After seeding, you can:
1. **Sign up** a new child account (pick an age band)
2. **Log in** as `admin` / `admin123` to access the admin panel
3. **Play as guest** — progress saves locally and can be migrated on sign-up

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Single-page app entry → AppShell
│   ├── layout.tsx            # Root layout (theme, toaster, providers)
│   ├── globals.css           # Tailwind + kid-friendly palette + animations
│   └── api/
│       ├── auth/             # signup, login, logout, me, guest
│       ├── gameplay/         # worlds, levels, questions, submit-round
│       ├── marketplace/      # list, buy, equip
│       ├── decks/            # CRUD, due-cards, review, match-score, study-session
│       ├── progress/         # stats, daily, daily/claim, transactions, badges, leaderboard
│       ├── parent/           # verify-pin, dashboard, assign-deck, settings
│       └── admin/            # characters, users, stats, csv-import
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   └── app/
│       ├── AppShell.tsx      # View router
│       ├── Providers.tsx     # Theme, QueryClient, settings hydration
│       ├── common/           # Header, Sidebar
│       ├── gameplay/         # Mascot, FeedbackBurst, Confetti, PreGameModal, LevelCompleteDialog
│       └── screens/          # Auth, Home, WorldMap, Gameplay, Marketplace, Collection,
│                             # Decks, FlashcardLearn, MatchGame, Progress, Leaderboard,
│                             # DailyChallenge, ParentDashboard, AdminPanel, Settings
├── lib/
│   ├── db.ts                 # Prisma client
│   ├── auth.ts               # Session helpers
│   ├── crypto.ts             # scrypt password hashing
│   ├── i18n.ts               # EN + AR dictionary
│   ├── math-engine.ts        # Question generation per age band & difficulty
│   ├── scoring.ts            # Points, stars, coins, bonuses
│   ├── spaced-repetition.ts  # Simplified SM-2 + Leitner boxes
│   ├── sounds.ts             # WebAudio synthesis
│   ├── daily.ts              # Daily challenge helpers
│   └── streaks.ts            # Streak tracking
├── store/                    # Zustand stores (app, settings)
├── hooks/                    # use-current-user, use-sound, use-toast
└── types/                    # Shared TypeScript types

prisma/
├── schema.prisma             # 19 models
└── seed.ts                   # Worlds, levels, characters, badges, decks + cards

scripts/
└── create-admin.ts           # Create an admin account
```

## Database Schema

19 models: `User`, `Session`, `World`, `Level`, `RoundAttempt`, `RoundResult`, `QuestionResult`, `Character`, `Purchase`, `Deck`, `Card`, `UserDeck`, `CardProgress`, `StudySession`, `MatchScore`, `Streak`, `Badge`, `UserBadge`, `DailyChallenge`, `UserDailyProgress`, `Transaction`.

Key design choices:
- **RoundAttempt** stores generated questions server-side (1-hour TTL) so `submit-round` can re-validate answers without trusting the client.
- **CardProgress** holds SM-2 state (ease, interval, nextReview, correctStreak) per (user, card).
- **Level** has no `ageBand` — questions adapt to the user's age band at play time, so the same 30 levels scale from ages 8 to 16.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Create a child account |
| POST | `/api/auth/login` | Log in + daily login bonus |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/guest` | Create/reuse a guest account |
| GET | `/api/gameplay/worlds` | List 5 worlds with progress |
| GET | `/api/gameplay/levels?worldId=` | 30 levels with unlock state |
| GET | `/api/gameplay/questions?levelId=` | Generate + store 10-15 questions |
| POST | `/api/gameplay/submit-round` | Validate + score + persist + rewards |
| GET | `/api/marketplace/list` | All characters with owned/equipped state |
| POST | `/api/marketplace/buy` | Purchase (guards: balance, duplicate) |
| POST | `/api/marketplace/equip` | Equip owned character |
| GET | `/api/decks` | Built-in + custom decks with mastery |
| POST | `/api/decks` | Create custom deck |
| GET | `/api/decks/[id]` | Deck detail + cards + per-card status |
| PUT | `/api/decks/[id]` | Update custom deck |
| DELETE | `/api/decks/[id]` | Delete custom deck |
| GET | `/api/decks/due-cards?deckId=` | Due + new cards for Learn mode |
| POST | `/api/decks/review` | Submit card review (SM-2) |
| POST | `/api/decks/match-score` | Save Match game result |
| POST | `/api/decks/study-session` | Record Learn session completion |
| GET | `/api/progress/stats` | Aggregate stats |
| GET | `/api/progress/daily` | Today's challenge + progress |
| POST | `/api/progress/daily/claim` | Claim daily reward |
| GET | `/api/progress/transactions` | Coin history |
| GET | `/api/progress/badges` | All badges with earned state |
| GET | `/api/progress/leaderboard` | Global + weekly rankings |
| POST | `/api/parent/verify-pin` | Verify parent PIN |
| GET | `/api/parent/dashboard` | Child overview for parents |
| POST | `/api/parent/assign-deck` | Assign/unassign deck |
| POST | `/api/parent/settings` | Set daily limits |
| GET | `/api/admin/characters` | All characters (admin) |
| POST | `/api/admin/characters` | Create/update character (admin) |
| GET | `/api/admin/users` | All users (admin) |
| GET | `/api/admin/stats` | Usage statistics (admin) |
| POST | `/api/admin/csv-import` | Bulk import cards (admin) |

## Future Improvements

1. **Multiplayer duels** — real-time head-to-head math races via WebSocket
2. **Fractions & geometry** — new worlds for fractions, decimals, percentages, angles, area/perimeter
3. **Teacher classrooms** — teacher accounts that manage multiple students, assign decks, view class-wide progress
4. **Word problems** — narrative-based questions with reading comprehension
5. **Achievement seasons** — time-limited events with exclusive characters
6. **Adaptive difficulty** — AI-driven difficulty adjustment based on per-question response times
7. **Parent reports** — weekly email summaries, progress export to PDF
8. **More languages** — Spanish, French, Hindi
9. **Voice narration** — read questions aloud for younger kids
10. **Offline mode** — PWA with service worker for offline play

## License

Educational project. No warranty. All characters are emoji/SVG-based (no external assets).
