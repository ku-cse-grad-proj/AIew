#!/bin/bash
# =============================================================================
# Nginx Upstream 전환 스크립트
# =============================================================================
#
# 사용법:
#   ./switch-upstream.sh <environment>
#
# 예시:
#   ./switch-upstream.sh blue
#   ./switch-upstream.sh green
#
# 동작:
#   1. upstream.conf 심볼릭 링크를 지정된 환경으로 변경
#   2. Nginx 설정 테스트
#   3. Nginx reload (무중단)
#
# =============================================================================

set -e

# -----------------------------------------------------------------------------
# 설정
# -----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NGINX_DIR="$(dirname "$SCRIPT_DIR")/nginx"
COMPOSE_FILE="$(dirname "$SCRIPT_DIR")/docker-compose.production.yml"

ENV="${1}"

# 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# -----------------------------------------------------------------------------
# 인자 확인
# -----------------------------------------------------------------------------
if [ -z "$ENV" ]; then
    echo -e "${RED}[ERROR]${NC} 환경을 지정해주세요: blue 또는 green"
    echo "사용법: $0 <blue|green>"
    exit 1
fi

if [ "$ENV" != "blue" ] && [ "$ENV" != "green" ]; then
    echo -e "${RED}[ERROR]${NC} 잘못된 환경: $ENV (blue 또는 green만 가능)"
    exit 1
fi

UPSTREAM_FILE="$NGINX_DIR/upstream-${ENV}.conf"

if [ ! -f "$UPSTREAM_FILE" ]; then
    echo -e "${RED}[ERROR]${NC} upstream 파일이 존재하지 않습니다: $UPSTREAM_FILE"
    exit 1
fi

# -----------------------------------------------------------------------------
# 1. upstream 설정 파일 복사
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[SWITCH]${NC} upstream 전환: $ENV"

cp "$UPSTREAM_FILE" "$NGINX_DIR/upstream.conf"

echo -e "${GREEN}[OK]${NC} upstream.conf ← upstream-${ENV}.conf"

# -----------------------------------------------------------------------------
# 2. Nginx 재시작
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[RESTART]${NC} Nginx 재시작 중... (upstream 설정 반영)"

COMPOSE_FILE="$(dirname "$SCRIPT_DIR")/docker-compose.production.yml"
docker compose -f "$COMPOSE_FILE" restart nginx

echo -e "${GREEN}[SUCCESS]${NC} Nginx 재시작 완료. 트래픽이 $ENV 환경으로 전환되었습니다."