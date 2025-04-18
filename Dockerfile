# syntax=docker.io/docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv

ARG IMAGE_TAG="node:22-alpine"

# Rebuild the source code only when needed
FROM ${IMAGE_TAG} AS builder

WORKDIR /app
COPY . .

ENV STYTCH_APP_ID=build-value
ENV STYTCH_APP_SECRET=something
ENV STYTCH_ENV=test

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable pnpm && \
  npx @biomejs/biome@^1.9.4 lint . && \
  npx @biomejs/biome@^1.9.4 check . && \
  pnpm run build:plain

# Production image, copy all the files and run next
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Configure OpenTelemetry for Google Cloud Trace
# ENV OTEL_SERVICE_NAME="conciliate-app"
# ENV OTEL_TRACES_EXPORTER="otlp"
# ENV OTEL_EXPORTER_OTLP_PROTOCOL="grpc"
ENV OTEL_NODE_RESOURCE_DETECTORS="gcp"
ENV OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=""
ENV NEXT_PUBLIC_SERVICE_NAME="conciliate-app"
ENV GOOGLE_CLOUD_PROJECT=""

RUN apk add --no-cache libc6-compat
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/node_modules.prod ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]