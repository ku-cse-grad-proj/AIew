# 1. Builder Stage
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependency definition files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy app-specific dependency definitions
COPY apps/web-client/package.json ./apps/web-client/

# Install dependencies for the entire monorepo
# --frozen-lockfile is used for CI/CD to ensure exact dependency versions
RUN pnpm install --frozen-lockfile

# Copy the rest of the web-client source code
COPY apps/web-client ./apps/web-client

# Build the Next.js application
RUN pnpm --filter web-client build

# 2. Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production \
    PORT=4000
# The Next.js app will run on port 4000
EXPOSE 4000

# Copy the standalone output from the builder stage
COPY --from=builder /app/apps/web-client/.next/standalone ./

# Copy the public assets and static build assets
COPY --from=builder /app/apps/web-client/public ./apps/web-client/public
COPY --from=builder /app/apps/web-client/.next/static ./apps/web-client/.next/static

# Start the Next.js server
CMD ["node", "apps/web-client/server.js"]
