# Contributing to MathQuest

Thank you for your interest in improving MathQuest!

## Getting Started
1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/mathquest.git`
3. Install dependencies: `bun install`
4. Set up the database: `cp .env.example .env` → edit DATABASE_URL → `bun run db:push` → `bun run prisma/seed.ts`
5. Start dev server: `bun run dev`

## Making Changes
1. Create a branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run lint: `bun run lint`
4. Commit: `git commit -m "Add: your feature description"`
5. Push: `git push origin feature/your-feature-name`
6. Open a Pull Request

## Code Style
- TypeScript throughout
- shadcn/ui components preferred
- Comment your code (especially math logic)
- Test on mobile (375px) and desktop

## Safety First
MathQuest is a kids' app. All contributions must:
- No ads, no chat, no external links
- No personal data collection
- Follow COPPA/GDPR-K principles
