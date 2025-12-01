#!/bin/bash

# SSH 보안 강화 스크립트
# 비밀번호 인증 차단, Root 로그인 차단, 인증 시도 제한

set -e

echo "=========================================="
echo "SSH 보안 설정 강화 시작"
echo "=========================================="

# 백업 생성
BACKUP_FILE="/etc/ssh/sshd_config.backup.$(date +%Y%m%d_%H%M%S)"
echo "1. SSH 설정 파일 백업: $BACKUP_FILE"
sudo cp /etc/ssh/sshd_config "$BACKUP_FILE"

# SSH 설정 변경
echo "2. SSH 보안 설정 적용..."

sudo tee /etc/ssh/sshd_config.d/99-security.conf > /dev/null <<EOF
# 비밀번호 인증 완전 차단 (키 인증만 허용)
PasswordAuthentication no
ChallengeResponseAuthentication no
UsePAM yes

# Root 로그인 차단
PermitRootLogin no

# 공개키 인증 활성화
PubkeyAuthentication yes

# 인증 시도 제한
MaxAuthTries 3
MaxSessions 10

# 빈 비밀번호 차단
PermitEmptyPasswords no

# 연결 유지 설정 (5분마다 확인, 2회 무응답 시 종료)
ClientAliveInterval 300
ClientAliveCountMax 2

# X11 포워딩 비활성화 (불필요)
X11Forwarding no

# 포트 포워딩 제한 (필요 시 활성화)
# AllowTcpForwarding no
# GatewayPorts no
EOF

# SSH 설정 테스트
echo "3. SSH 설정 검증 중..."
if sudo sshd -t; then
    echo "✓ SSH 설정이 올바릅니다."
else
    echo "✗ SSH 설정 오류 발견! 백업 파일로 복구하세요: $BACKUP_FILE"
    exit 1
fi

# SSH 서비스 재시작
echo "4. SSH 서비스 재시작..."
# Ubuntu는 ssh.service, CentOS/RHEL은 sshd.service 사용
if systemctl list-units --type=service --all | grep -q "ssh.service"; then
    sudo systemctl restart ssh
elif systemctl list-units --type=service --all | grep -q "sshd.service"; then
    sudo systemctl restart sshd
else
    echo "⚠️  SSH 서비스를 찾을 수 없습니다. 수동으로 재시작하세요."
    exit 1
fi

echo ""
echo "=========================================="
echo "✓ SSH 보안 설정 완료!"
echo "=========================================="
echo ""
echo "적용된 보안 설정:"
echo "  - 비밀번호 인증 차단 (키 인증만 허용)"
echo "  - Root 로그인 차단"
echo "  - 인증 시도 3회 제한"
echo "  - 빈 비밀번호 차단"
echo "  - X11 포워딩 비활성화"
echo ""
echo "⚠️  중요: 현재 SSH 세션을 유지한 채로 새 터미널에서 접속 테스트하세요!"
echo "⚠️  SSH 키가 제대로 설정되지 않았다면 접속이 불가능합니다."
echo ""
echo "백업 파일: $BACKUP_FILE"
echo ""