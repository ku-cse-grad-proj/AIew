#!/bin/bash
# =============================================================================
# 개발 환경 실행 스크립트
# =============================================================================
# - Redis 컨테이너 시작 (없으면 생성)
# - 종료 시 Redis 자동 stop
# - web-client, core-api, ai-server 동시 실행
# =============================================================================

# Redis 시작 (이미 있으면 start, 없으면 run)
docker start redis 2>/dev/null || docker run -d --name redis -p 6379:6379 redis:alpine

# 종료 시 Redis stop
trap "docker stop redis" EXIT

# 서비스 실행
pnpm concurrently -n web,api,ai -c cyan,green,magenta \
  "pnpm -F web-client dev" \
  "pnpm -F core-api dev" \
  "poetry --directory apps/ai-server run uvicorn app.main:app --reload --port 8000"