# syntax=docker.io/docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv

# Use Node Alpine for smaller image size in both stages
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and scripts first to leverage caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY scripts ./scripts/
COPY dist-packages ./dist-packages/

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

# Build the application (assuming pnpm install and build steps already done in GitHub Actions)
# We're just preparing the files for the production image here
RUN corepack enable pnpm && \
    node -e "console.log('Using pre-built .next directory')"

# Production image
FROM node:20-alpine AS runner
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
COPY --from=builder --chown=nextjs:nodejs /app/dist-packages ./dist-packages
COPY --from=builder --chown=nextjs:nodejs /app/submods ./submods
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages
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
CMD ["node", "server.js"]