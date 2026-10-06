# syntax=docker/dockerfile:1.7
# Multi-stage build: deps → build → (tools | runner). Final image is a non-root Next.js standalone server.

ARG NODE_VERSION=24-alpine

# ─────────── deps: full install (cached by lockfile) ───────────
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts

# ─────────── build ───────────
FROM deps AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
COPY . .
RUN npx prisma generate && npx next build

# ─────────── tools: one-shot migrate + seed (used by docker-compose `migrate`) ───────────
FROM deps AS tools
WORKDIR /app
ENV NODE_ENV=development
COPY . .
RUN npx prisma generate
# default command is supplied by docker-compose / CI

# ─────────── runner: minimal production image ───────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
