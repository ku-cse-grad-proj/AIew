#!/bin/bash

# Fail2ban 설치 및 설정 스크립트
# 브루트포스 SSH 공격 자동 차단

set -e

echo "=========================================="
echo "Fail2ban 설치 및 설정 시작"
echo "=========================================="

# Fail2ban 설치
echo "1. Fail2ban 설치 중..."
sudo apt update
sudo apt install -y fail2ban

# Fail2ban 로컬 설정 파일 생성
echo "2. Fail2ban 설정 파일 생성..."

sudo tee /etc/fail2ban/jail.local > /dev/null <<'EOF'
[DEFAULT]
# 차단 시간 (초): 1시간
bantime = 3600

# 감시 시간 (초): 10분
findtime = 600

# 최대 재시도 횟수
maxretry = 3

# 차단 대상 제외 IP (로컬 네트워크)
ignoreip = 127.0.0.1/8 ::1

# 이메일 알림 (선택사항)
# destemail = your-email@example.com
# sendername = Fail2ban
# action = %(action_mwl)s

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF

echo "3. Fail2ban 서비스 시작..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# 상태 확인
echo ""
echo "=========================================="
echo "✓ Fail2ban 설치 및 설정 완료!"
echo "=========================================="
echo ""
echo "적용된 보안 설정:"
echo "  - 10분 내 3회 로그인 실패 시 1시간 차단"
echo "  - SSH 포트 보호 활성화"
echo ""
echo "Fail2ban 상태 확인:"
sudo fail2ban-client status

echo ""
echo "SSH jail 상세 상태:"
sudo fail2ban-client status sshd || echo "아직 차단된 IP가 없습니다."

echo ""
echo "유용한 명령어:"
echo "  - 전체 상태: sudo fail2ban-client status"
echo "  - SSH 상태: sudo fail2ban-client status sshd"
echo "  - IP 차단 해제: sudo fail2ban-client set sshd unbanip <IP>"
echo "  - 로그 확인: sudo tail -f /var/log/fail2ban.log"
echo ""