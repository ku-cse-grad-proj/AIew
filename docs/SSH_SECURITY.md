# SSH 보안 강화 가이드

Azure VM의 SSH 포트(22) 보안을 강화하기 위한 설정 가이드입니다.

## 보안 위협

- SSH 포트 22는 자동화된 봇 공격의 1순위 타겟
- 브루트포스 공격으로 비밀번호 크래킹 시도
- GitHub Actions Runner IP는 계속 변경되어 IP 화이트리스트 불가능

## 해결 방안

### Phase 1: 필수 보안 설정 (즉시 적용)

#### 1. SSH 설정 강화

비밀번호 인증을 완전히 차단하고 SSH 키 인증만 허용합니다.

**자동 설정:**

```bash
cd ~/aiew
chmod +x scripts/setup-ssh-security.sh
sudo ./scripts/setup-ssh-security.sh
```

**수동 설정:**

```bash
# SSH 설정 파일 편집
sudo nano /etc/ssh/sshd_config

# 다음 설정 추가/수정:
PasswordAuthentication no          # 비밀번호 인증 차단
PermitRootLogin no                 # Root 로그인 차단
PubkeyAuthentication yes           # 공개키 인증만 허용
MaxAuthTries 3                     # 인증 시도 3회 제한
PermitEmptyPasswords no            # 빈 비밀번호 차단
ClientAliveInterval 300            # 5분마다 연결 확인
ClientAliveCountMax 2              # 무응답 2회면 연결 종료

# 설정 확인 및 재시작
sudo sshd -T
sudo systemctl restart ssh  # Ubuntu
# 또는
# sudo systemctl restart sshd  # CentOS/RHEL
```

⚠️ **중요:** 변경 전 반드시 SSH 키가 제대로 설정되어 있는지 확인하세요!

#### 2. Fail2ban 설치

브루트포스 공격을 자동으로 차단합니다.

**자동 설정:**

```bash
cd ~/aiew
chmod +x scripts/setup-fail2ban.sh
sudo ./scripts/setup-fail2ban.sh
```

**수동 설정:**

```bash
# Fail2ban 설치
sudo apt update
sudo apt install -y fail2ban

# 설정 파일 생성
sudo tee /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600      # 1시간 차단
findtime = 600      # 10분 감시
maxretry = 3        # 3회 실패 시 차단

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
EOF

# 서비스 시작
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 보안 설정 확인

### SSH 설정 확인

```bash
# 현재 SSH 설정 확인
sudo sshd -T | grep -i "passwordauthentication\|permitrootlogin\|pubkeyauthentication"

# 출력 예시:
# passwordauthentication no
# permitrootlogin no
# pubkeyauthentication yes
```

### Fail2ban 상태 확인

```bash
# 전체 상태
sudo fail2ban-client status

# SSH jail 상태
sudo fail2ban-client status sshd

# 차단된 IP 확인
sudo fail2ban-client status sshd | grep "Banned IP"

# Fail2ban 로그
sudo tail -f /var/log/fail2ban.log
```

### 공격 시도 로그 확인

```bash
# 최근 SSH 로그인 실패 시도
sudo grep "Failed password" /var/log/auth.log | tail -20

# 차단된 공격 시도
sudo grep "Ban" /var/log/fail2ban.log | tail -20
```

## Phase 2: 선택적 추가 보안 (선택)

### 1. SSH 포트 변경

기본 포트 22를 다른 포트로 변경하여 자동화된 봇 회피:

```bash
# /etc/ssh/sshd_config
Port 2222

# 방화벽 설정
sudo ufw allow 2222/tcp
sudo ufw delete allow 22/tcp

# Azure NSG에서 포트 22 → 2222 변경

# GitHub Actions workflow 수정 필요
# ssh -p 2222 user@host
```

**장점:** 자동화된 봇 공격 감소
**단점:** GitHub Actions workflow 수정 필요

### 2. Azure NSG 설정

Azure Portal에서 Network Security Group 설정:

```text
우선순위 100: 본인 IP → SSH 허용
우선순위 200: GitHub Actions IP 범위 → SSH 허용
우선순위 1000: 나머지 → SSH 차단
```

**문제:** GitHub Actions IP 범위가 매우 넓음 (수백 개)

GitHub Actions IP 범위 확인:

```bash
curl https://api.github.com/meta | jq -r '.actions[]'
```

## Phase 3: 최고 보안 (장기 개선)

### Tailscale + Self-hosted Runner

VPN으로 SSH를 완전히 보호:

1. VM에 Tailscale 설치
2. SSH는 Tailscale 네트워크에서만 허용
3. Self-hosted GitHub Actions Runner 사용
4. Public SSH 포트 완전 차단

**장점:**

- Public SSH 포트 완전 차단
- VPN으로 안전한 접속
- IP 화이트리스트 불필요

**단점:**

- 설정 복잡도 증가
- Self-hosted runner 관리 필요

## Fail2ban 관리 명령어

```bash
# 전체 상태 확인
sudo fail2ban-client status

# SSH jail 상태
sudo fail2ban-client status sshd

# 특정 IP 차단 해제
sudo fail2ban-client set sshd unbanip 1.2.3.4

# 특정 IP 수동 차단
sudo fail2ban-client set sshd banip 1.2.3.4

# Fail2ban 재시작
sudo systemctl restart fail2ban

# 로그 실시간 확인
sudo tail -f /var/log/fail2ban.log
```

## 차단된 경우 대처

본인이 실수로 차단된 경우:

```bash
# 다른 방법으로 VM 접속 (Azure Serial Console 등)

# 차단 해제
sudo fail2ban-client set sshd unbanip YOUR_IP

# 또는 Fail2ban 일시 중지
sudo systemctl stop fail2ban

# 설정 수정 후 재시작
sudo systemctl start fail2ban
```

## 권장 설정 요약

**필수 (Phase 1):**

- ✅ SSH 키 인증만 허용 (비밀번호 차단)
- ✅ Root 로그인 차단
- ✅ Fail2ban 설치 (브루트포스 차단)

**선택 (Phase 2):**

- SSH 포트 변경 (보안 향상 + GitHub Actions 수정 필요)
- Azure NSG IP 제한 (복잡함)

**장기 (Phase 3):**

- Tailscale + Self-hosted Runner (최고 보안)

## 모니터링

정기적으로 보안 상태를 확인하세요:

```bash
# 매주 확인할 것
sudo fail2ban-client status sshd
sudo grep "Failed password" /var/log/auth.log | wc -l
sudo grep "Ban" /var/log/fail2ban.log | tail -20
```

## 참고 자료

- [Fail2ban 공식 문서](https://www.fail2ban.org/)
- [OpenSSH 보안 가이드](https://www.openssh.com/security.html)
- [GitHub Actions IP 범위](https://api.github.com/meta)
