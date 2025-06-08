# syntax=docker.io/docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv

# Use Node Alpine for smaller image size in both stages
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat python3 make g++ git wget tar build-base bsd-compat-headers curl gcc ca-certificates

WORKDIR /app

# Copy package files and scripts first to leverage caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY dist-packages ./dist-packages/
RUN ls /app/dist-packages/
COPY patches ./patches
RUN corepack enable pnpm
RUN npm install -g npm@latest node-gyp@latest
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Set build environment variables
ENV STYTCH_APP_ID=build-value
ENV STYTCH_APP_SECRET=something
ENV STYTCH_ENV=test
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_COMPILE_CACHE_PATH="/tmp/.next/cache/webpack" 
ENV DISABLE_ANALYZER=1
ENV NODE_NO_WARNINGS=1

RUN pnpm build
RUN pnpm prune --production

# Production image
FROM node:22-alpine AS runner
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV OTEL_NODE_RESOURCE_DETECTORS="gcp"
ENV NEXT_PUBLIC_SERVICE_NAME="conciliate-app"

# Install necessary packages
RUN apk add --no-cache libc6-compat

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Copy Next.js output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Enable pnpm
RUN corepack enable pnpm

# Set user to non-root
USER nextjs

# Expose the port the app will run on
EXPOSE 3000

# Set the host to be properly accessible
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["pnpm", "node", "server.js"]