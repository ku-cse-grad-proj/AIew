#!/bin/bash
# =============================================================================
# Nginx Upstream 전환 스크립트 (수동 전환 / 롤백용)
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
#   1. upstream.conf 파일을 지정된 환경으로 복사
#   2. Nginx 설정 테스트 (실패 시 롤백)
#   3. Nginx restart (bind mount inode 변경 반영)
#
# =============================================================================

set -e

# -----------------------------------------------------------------------------
# 설정
# -----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
NGINX_DIR="$(dirname "$SCRIPT_DIR")/nginx"
COMPOSE_FILE="$(dirname "$SCRIPT_DIR")/docker-compose.production.yml"
ACTIVE_ENV_FILE="$PROJECT_DIR/.active-env"

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

# 대상 환경의 컨테이너가 실행 중인지 확인 (nginx가 라우팅하는 서비스들)
for SERVICE in web-client core-api ai-server; do
    if ! docker ps --format '{{.Names}}' | grep -q "aiew-${SERVICE}-$ENV"; then
        echo -e "${RED}[ERROR]${NC} $ENV 환경의 $SERVICE 컨테이너가 실행 중이 아닙니다."
        echo "먼저 $ENV 환경을 시작해주세요:"
        echo "  docker compose -f $COMPOSE_FILE --profile $ENV up -d"
        exit 1
    fi
done

# 현재 활성 환경 확인
if [ -f "$ACTIVE_ENV_FILE" ]; then
    CURRENT_ENV=$(cat "$ACTIVE_ENV_FILE")
else
    CURRENT_ENV="unknown"
fi

echo -e "${YELLOW}[INFO]${NC} 현재 활성 환경: $CURRENT_ENV"
echo -e "${YELLOW}[INFO]${NC} 전환 대상 환경: $ENV"

# -----------------------------------------------------------------------------
# 1. upstream 설정 파일 복사
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[SWITCH]${NC} upstream 전환: $ENV"

cp "$UPSTREAM_FILE" "$NGINX_DIR/upstream.conf"

echo -e "${GREEN}[OK]${NC} upstream.conf ← upstream-${ENV}.conf"

# -----------------------------------------------------------------------------
# 2. Nginx 설정 테스트
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[TEST]${NC} Nginx 설정 테스트 중..."

if ! docker compose -f "$COMPOSE_FILE" exec -T nginx nginx -t; then
    echo -e "${RED}[ERROR]${NC} Nginx 설정 오류! 롤백합니다."

    # 롤백: 이전 환경으로 복구
    if [ "$CURRENT_ENV" != "unknown" ] && [ "$CURRENT_ENV" != "$ENV" ]; then
        cp "$NGINX_DIR/upstream-${CURRENT_ENV}.conf" "$NGINX_DIR/upstream.conf"
        echo -e "${YELLOW}[ROLLBACK]${NC} upstream.conf ← upstream-${CURRENT_ENV}.conf"
    fi
    exit 1
fi

echo -e "${GREEN}[OK]${NC} Nginx 설정 검증 통과"

# -----------------------------------------------------------------------------
# 3. Nginx restart (bind mount 파일 inode 변경 반영 위해 restart 필요)
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[RESTART]${NC} Nginx restart 중..."

docker compose -f "$COMPOSE_FILE" restart nginx

# -----------------------------------------------------------------------------
# 4. 활성 환경 기록
# -----------------------------------------------------------------------------
echo "$ENV" > "$ACTIVE_ENV_FILE"

echo -e "${GREEN}[SUCCESS]${NC} Nginx restart 완료. 트래픽이 $ENV 환경으로 전환되었습니다."