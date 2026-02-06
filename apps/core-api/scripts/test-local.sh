#!/usr/bin/env bash
set -euo pipefail

DB_CONTAINER="aiew-test-db"
REDIS_CONTAINER="aiew-test-redis"
DATABASE_URL="postgresql://test:test@localhost:5433/aiew_test"

cleanup() {
  echo "Cleaning up containers..."
  docker rm -f "$DB_CONTAINER" "$REDIS_CONTAINER" 2>/dev/null || true
}

trap cleanup EXIT

echo "Starting PostgreSQL..."
docker run -d --name "$DB_CONTAINER" \
  -e POSTGRES_USER=test \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=aiew_test \
  -p 5433:5432 \
  --tmpfs /var/lib/postgresql/data \
  postgres:16-alpine

echo "Starting Redis..."
docker run -d --name "$REDIS_CONTAINER" \
  -p 6379:6379 \
  redis:7-alpine

echo "Waiting for PostgreSQL to be ready..."
until docker exec "$DB_CONTAINER" pg_isready -U test 2>/dev/null; do
  sleep 1
done

echo "Waiting for Redis to be ready..."
until docker exec "$REDIS_CONTAINER" redis-cli ping 2>/dev/null | grep -q PONG; do
  sleep 1
done

echo "Running database migration..."
DATABASE_URL="$DATABASE_URL" pnpm exec prisma migrate deploy

echo "Running tests..."
pnpm vitest run --coverage && rimraf coverage
