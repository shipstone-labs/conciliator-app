# syntax=docker.io/docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv

FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat python3 make g++ git wget tar build-base bsd-compat-headers
      
WORKDIR /app

ARG TINYGO_VERSION=0.30.0
ARG GO_VERSION=1.21.6

RUN wget -q https://golang.org/dl/go${GO_VERSION}.linux-amd64.tar.gz && \
  tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz && \
  rm go${GO_VERSION}.linux-amd64.tar.gz

RUN wget -q https://github.com/tinygo-org/tinygo/releases/download/v${TINYGO_VERSION}/tinygo${TINYGO_VERSION}.linux-amd64.tar.gz && \
  tar -C /usr/local -xzf tinygo${TINYGO_VERSION}.linux-amd64.tar.gz && \
  rm tinygo${TINYGO_VERSION}.linux-amd64.tar.gz

ENV PATH="${PATH}:/usr/local/go/bin:/usr/local/tinygo/bin:/root/go/bin"
RUN mkdir -p /root/go
ENV GOPATH="/root/go"

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-*.yaml* .npmrc* ./
COPY packages/lit-wrapper/package.json ./packages/lit-wrapper/
COPY packages/web-storage-wrapper/package.json ./packages/web-storage-wrapper/
COPY packages/lilypad-wrapper/package.json ./packages/lilypad-wrapper/

RUN corepack enable pnpm && pnpm i --frozen-lockfile

COPY packages ./packages

RUN pnpm build-wrappers

# Rebuild the source code only when needed
FROM base AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY . .

ARG NEXT_PUBLIC_STYTCH_PROJECT_ENV
ARG NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN
ARG NEXT_PUBLIC_STYTCH_APP_ID
ARG NEXT_PUBLIC_LIT_RELAY_API_KEY
ARG NEXT_PUBLIC_LIT_CONTRACT_ADDRESS
ARG NEXT_PUBLIC_LIT_ADDRESS
ARG NEXT_PUBLIC_FIREBASE_CONFIG={"project_id":"some-hack"}

ENV STYTCH_APP_ID=build-value
ENV STYTCH_APP_SECRET=something
ENV STYTCH_ENV=test

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable pnpm && pnpm run build:plain
RUN rm notthere

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN npm add dotenv

COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs ./start.js ./start.js

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["node", "start.js"]