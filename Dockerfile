# Dockerfile for Railway / Fly.io / any container platform.
# Keeps SQLite — mount a persistent volume at /data to preserve the database.

FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client
RUN bun run db:generate

# Build Next.js (standalone output)
RUN bun run build

# ─── Runner stage ───
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/mathquest.db
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy standalone build + public + prisma
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/scripts ./scripts
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=base /app/package.json ./package.json

# Create data directory for SQLite
RUN mkdir -p /data

# Initialize database on first run
RUN bun run db:push && bun run prisma/seed.ts && bun run scripts/create-admin.ts

EXPOSE 3000
CMD ["bun", "server.js"]
