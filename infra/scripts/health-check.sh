#!/bin/bash
# =============================================================================
# 헬스체크 스크립트
# =============================================================================
#
# 사용법:
#   ./health-check.sh <environment> [timeout_seconds]
#
# 예시:
#   ./health-check.sh blue 120
#   ./health-check.sh green
#
# Docker 헬스체크 상태를 확인하여 모든 컨테이너가 healthy 상태가 될 때까지 대기
#
# =============================================================================

set -e

# -----------------------------------------------------------------------------
# 설정
# -----------------------------------------------------------------------------
ENV="${1:-blue}"
TIMEOUT="${2:-120}"
INTERVAL=5

# 대상 컨테이너들
CONTAINERS=(
    "aiew-core-api-$ENV"
    "aiew-ai-server-$ENV"
    "aiew-web-client-$ENV"
)

# 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# -----------------------------------------------------------------------------
# 헬스체크 함수
# -----------------------------------------------------------------------------
check_container_health() {
    local container=$1
    local status

    # 컨테이너 존재 확인
    if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        echo "not_found"
        return
    fi

    # 헬스 상태 확인
    status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no_healthcheck")
    echo "$status"
}

# -----------------------------------------------------------------------------
# 메인 로직
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[HEALTH CHECK]${NC} $ENV 환경 헬스체크 시작 (timeout: ${TIMEOUT}s)"

elapsed=0

while [ $elapsed -lt $TIMEOUT ]; do
    all_healthy=true
    status_line=""

    for container in "${CONTAINERS[@]}"; do
        status=$(check_container_health "$container")

        case $status in
            "healthy")
                status_line+="${GREEN}✓${NC} $container "
                ;;
            "unhealthy")
                status_line+="${RED}✗${NC} $container "
                all_healthy=false
                ;;
            "starting")
                status_line+="${YELLOW}○${NC} $container "
                all_healthy=false
                ;;
            "not_found")
                status_line+="${RED}?${NC} $container "
                all_healthy=false
                ;;
            *)
                status_line+="${YELLOW}~${NC} $container "
                all_healthy=false
                ;;
        esac
    done

    echo -ne "\r[${elapsed}s] $status_line"

    if $all_healthy; then
        echo ""
        echo -e "${GREEN}[SUCCESS]${NC} 모든 컨테이너가 healthy 상태입니다."
        exit 0
    fi

    sleep $INTERVAL
    elapsed=$((elapsed + INTERVAL))
done

# 타임아웃
echo ""
echo -e "${RED}[FAILED]${NC} 헬스체크 타임아웃 (${TIMEOUT}s)"

# 실패한 컨테이너 로그 출력
for container in "${CONTAINERS[@]}"; do
    status=$(check_container_health "$container")
    if [ "$status" != "healthy" ]; then
        echo -e "${RED}--- $container 로그 ---${NC}"
        docker logs --tail 20 "$container" 2>&1 || true
    fi
done

exit 1