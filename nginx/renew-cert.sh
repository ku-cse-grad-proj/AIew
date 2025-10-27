#!/bin/bash

# SSL 인증서 자동 갱신 스크립트
# Let's Encrypt 인증서는 90일마다 만료되므로 자동 갱신 필요

set -e

# 스크립트 위치를 기준으로 프로젝트 루트 디렉토리 결정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "[$(date)] Starting SSL certificate renewal check..."

# Certbot으로 인증서 갱신 시도 (만료 30일 전부터 갱신 가능)
# --quiet: 갱신 필요 없으면 출력 없음
# --deploy-hook: 갱신 성공 시에만 실행되는 훅 (sh -c로 쉘 명령 실행)
sudo certbot renew --webroot --webroot-path=/var/www/certbot --quiet \
    --deploy-hook "sh -c 'cd $PROJECT_DIR && docker compose -f docker-compose.base.yml -f docker-compose.production.yml exec -T nginx nginx -s reload'"

echo "[$(date)] Certificate renewal check completed"