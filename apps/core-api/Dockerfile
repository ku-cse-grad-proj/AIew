# 1. Builder Stage
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependency definition files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy app-specific dependency definitions and tsconfig
COPY apps/core-api/package.json ./apps/core-api/
COPY apps/core-api/tsconfig.json ./apps/core-api/

# Copy prisma schema
COPY apps/core-api/prisma ./apps/core-api/prisma

# Install dependencies for the entire monorepo
RUN apt-get update -y && apt-get install -y openssl
RUN pnpm install --frozen-lockfile

# Copy the rest of the core-api source code
COPY apps/core-api ./apps/core-api

# Generate Prisma client
RUN pnpm --filter core-api exec prisma generate --no-engine

# Build the TypeScript application
RUN pnpm --filter core-api build

# 2. Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV production
# The Fastify app will run on port 3000
EXPOSE 3000

# Copy production dependencies from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/core-api/node_modules ./apps/core-api/node_modules

# Copy compiled code, prisma schema, and package.json
COPY --from=builder /app/apps/core-api/dist ./apps/core-api/dist
COPY --from=builder /app/apps/core-api/prisma ./apps/core-api/prisma
COPY --from=builder /app/apps/core-api/package.json ./apps/core-api/

# Start the Fastify server
CMD ["node", "apps/core-api/dist/server.js"]
