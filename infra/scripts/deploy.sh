#!/bin/bash
# =============================================================================
# Blue-Green 배포 스크립트
# =============================================================================
#
# 사용법:
#   ./deploy.sh <tag> <github_token>
#
# 예시:
#   ./deploy.sh v1.2.3 ghp_xxxxxxxxxxxx
#
# 배포 흐름:
#   1. 현재 활성 환경 확인 (blue or green)
#   2. 비활성 환경에 새 버전 빌드
#   3. 새 환경 시작 및 헬스체크
#   4. Nginx upstream 전환
#   5. 이전 환경 종료
#   6. GHCR에 이미지 푸시 (백업용)
#   7. 정리 (오래된 이미지 삭제)
#
# =============================================================================

set -e  # 에러 발생 시 즉시 종료

# -----------------------------------------------------------------------------
# 설정
# -----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
INFRA_DIR="$PROJECT_DIR/infra"
COMPOSE_FILE="$INFRA_DIR/docker-compose.production.yml"
ACTIVE_ENV_FILE="$PROJECT_DIR/.active-env"

# GHCR 설정
REGISTRY="ghcr.io"
IMAGE_PREFIX="ku-cse-grad-proj/aiew"

# 색상 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# -----------------------------------------------------------------------------
# 유틸리티 함수
# -----------------------------------------------------------------------------
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# -----------------------------------------------------------------------------
# 인자 확인
# -----------------------------------------------------------------------------
TAG="${1:-latest}"
GITHUB_TOKEN="$2"

if [ -z "$GITHUB_TOKEN" ]; then
    log_warning "GITHUB_TOKEN이 제공되지 않음. GHCR 푸시를 건너뜁니다."
fi

log_info "배포 시작: $TAG"
log_info "프로젝트 경로: $PROJECT_DIR"

# -----------------------------------------------------------------------------
# 1. 현재 활성 환경 확인
# -----------------------------------------------------------------------------
if [ -f "$ACTIVE_ENV_FILE" ]; then
    CURRENT_ENV=$(cat "$ACTIVE_ENV_FILE")
else
    CURRENT_ENV="blue"
    echo "$CURRENT_ENV" > "$ACTIVE_ENV_FILE"
fi

# 다음 환경 결정
if [ "$CURRENT_ENV" = "blue" ]; then
    NEXT_ENV="green"
else
    NEXT_ENV="blue"
fi

log_info "현재 활성 환경: $CURRENT_ENV"
log_info "배포 대상 환경: $NEXT_ENV"

# -----------------------------------------------------------------------------
# 2. 새 버전 빌드
# -----------------------------------------------------------------------------
log_info "[$NEXT_ENV] 환경 빌드 중..."

docker compose -f "$COMPOSE_FILE" --profile "$NEXT_ENV" build --no-cache

log_success "빌드 완료"

# -----------------------------------------------------------------------------
# 3. 새 환경 시작 (nginx 제외 - 앱 서비스만)
# -----------------------------------------------------------------------------
log_info "[$NEXT_ENV] 환경 시작 중... (앱 서비스만)"

docker compose -f "$COMPOSE_FILE" --profile "$NEXT_ENV" up -d --no-deps \
    core-api-"$NEXT_ENV" \
    ai-server-"$NEXT_ENV" \
    web-client-"$NEXT_ENV"

log_success "앱 컨테이너 시작됨"

# -----------------------------------------------------------------------------
# 4. 헬스체크
# -----------------------------------------------------------------------------
log_info "헬스체크 대기 중... (최대 120초)"

"$SCRIPT_DIR/health-check.sh" "$NEXT_ENV" 120

log_success "헬스체크 통과"

# -----------------------------------------------------------------------------
# 5. Nginx upstream 전환 및 시작
# -----------------------------------------------------------------------------
log_info "Nginx upstream 설정: $NEXT_ENV"

# upstream 설정 파일 복사
NGINX_DIR="$INFRA_DIR/nginx"
cp "$NGINX_DIR/upstream-${NEXT_ENV}.conf" "$NGINX_DIR/upstream.conf"
log_info "upstream.conf ← upstream-${NEXT_ENV}.conf"

# nginx 시작 또는 reload
if docker ps --format '{{.Names}}' | grep -q "^aiew-nginx$"; then
    log_info "Nginx 컨테이너에 upstream 설정 복사 및 reload 중..."
    # Docker 볼륨 캐시 문제로 컨테이너 내부에 직접 복사
    docker cp "$NGINX_DIR/upstream.conf" aiew-nginx:/etc/nginx/upstream.conf
    docker exec aiew-nginx nginx -t
    docker exec aiew-nginx nginx -s reload
else
    log_info "Nginx 시작 중..."
    docker compose -f "$COMPOSE_FILE" up -d nginx
fi

log_success "트래픽 전환 완료"

# -----------------------------------------------------------------------------
# 6. 활성 환경 기록
# -----------------------------------------------------------------------------
echo "$NEXT_ENV" > "$ACTIVE_ENV_FILE"
log_info "활성 환경 업데이트: $NEXT_ENV"

# -----------------------------------------------------------------------------
# 7. 이전 환경 종료 (nginx 제외)
# -----------------------------------------------------------------------------
log_info "[$CURRENT_ENV] 이전 환경 종료 중..."

# nginx를 제외하고 이전 환경의 앱 서비스만 종료
docker compose -f "$COMPOSE_FILE" rm -sf \
    core-api-"$CURRENT_ENV" \
    ai-server-"$CURRENT_ENV" \
    web-client-"$CURRENT_ENV"

log_success "이전 환경 종료됨"

# -----------------------------------------------------------------------------
# 8. GHCR에 이미지 푸시 (백업용, 선택적)
# -----------------------------------------------------------------------------
if [ -n "$GITHUB_TOKEN" ]; then
    log_info "GHCR에 이미지 푸시 중..."

    if echo "$GITHUB_TOKEN" | docker login "$REGISTRY" -u "github-actions" --password-stdin 2>/dev/null; then
        # 이미지 태그 (/ 를 - 로 변환)
        IMAGE_TAG=$(echo "$TAG" | sed 's/\//-/g')

        for SERVICE in core-api ai-server web-client; do
            LOCAL_IMAGE="infra-${SERVICE}-${NEXT_ENV}"
            REMOTE_IMAGE="$REGISTRY/$IMAGE_PREFIX/$SERVICE:$IMAGE_TAG"

            if docker tag "$LOCAL_IMAGE" "$REMOTE_IMAGE" && docker push "$REMOTE_IMAGE"; then
                # latest 태그도 푸시
                docker tag "$LOCAL_IMAGE" "$REGISTRY/$IMAGE_PREFIX/$SERVICE:latest"
                docker push "$REGISTRY/$IMAGE_PREFIX/$SERVICE:latest" || true
                log_info "  - $SERVICE:$IMAGE_TAG 푸시 완료"
            else
                log_warning "  - $SERVICE 푸시 실패 (계속 진행)"
            fi
        done

        log_success "GHCR 푸시 완료"
    else
        log_warning "GHCR 로그인 실패. 푸시를 건너뜁니다."
    fi
fi

# -----------------------------------------------------------------------------
# 9. 정리
# -----------------------------------------------------------------------------
log_info "오래된 이미지 정리 중..."
docker image prune -af

log_success "============================================"
log_success "배포 완료!"
log_success "  버전: $TAG"
log_success "  활성 환경: $NEXT_ENV"
log_success "============================================"