# SSL 인증서 자동 갱신 설정 가이드

Let's Encrypt SSL 인증서는 90일마다 만료되므로 자동 갱신이 필요합니다.

## 빠른 설정 (VM에서 실행)

```bash
# 1. 스크립트 권한 설정
cd ~/aiew
chmod +x nginx/renew-cert.sh

# 2. 로그 디렉토리 생성
sudo mkdir -p /var/log

# 3. sudo NOPASSWD 권한 설정 (certbot용)
echo "$USER ALL=(ALL) NOPASSWD: /usr/bin/certbot" | sudo tee /etc/sudoers.d/certbot-renewal
sudo chmod 440 /etc/sudoers.d/certbot-renewal

# 4. Cron Job 설정
crontab -e
# 다음 라인 추가:
# 0 3 * * * ~/aiew/nginx/renew-cert.sh >> /var/log/certbot-renewal.log 2>&1

# 5. 갱신 테스트
./nginx/renew-cert.sh
```

## 상세 설정

### 1. 갱신 스크립트 권한 설정

VM에 SSH 접속 후:

```bash
cd ~/aiew
chmod +x nginx/renew-cert.sh
```

### 2. sudo NOPASSWD 권한 설정

Cron에서 certbot을 sudo로 실행하기 위해 비밀번호 없이 실행 가능하도록 설정:

```bash
# certbot 명령만 NOPASSWD 허용
echo "$USER ALL=(ALL) NOPASSWD: /usr/bin/certbot" | sudo tee /etc/sudoers.d/certbot-renewal
sudo chmod 440 /etc/sudoers.d/certbot-renewal

# 설정 확인
sudo -l | grep certbot
```

⚠️ **보안 참고:** certbot 명령만 비밀번호 없이 실행 가능하도록 제한했습니다.

### 3. Cron Job 설정

#### Crontab 사용 (권장)

```bash
# Crontab 편집기 열기
crontab -e

# 다음 라인 추가 (매일 오전 3시에 갱신 체크)
0 3 * * * ~/aiew/nginx/renew-cert.sh >> /var/log/certbot-renewal.log 2>&1
```

#### Systemd Timer 사용 (대안)

더 모던한 방법이지만 설정이 복잡합니다. 간단한 작업이므로 crontab 추천.

### 4. 수동 갱신 테스트

실제 갱신 전에 dry-run으로 테스트:

```bash
# Dry-run 테스트 (실제 갱신하지 않음)
sudo certbot renew --dry-run --webroot --webroot-path=/var/www/certbot

# 문제없으면 스크립트 실행 테스트
./nginx/renew-cert.sh
```

### 5. 로그 확인

```bash
# Cron 실행 로그 확인
tail -f /var/log/certbot-renewal.log

# Certbot 로그 확인
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### 6. 인증서 만료일 확인

```bash
# 현재 인증서 만료일 확인
sudo certbot certificates

# 또는
openssl x509 -in /etc/letsencrypt/live/aiew.dev/fullchain.pem -noout -dates
```

## 작동 원리

1. **Cron Job**: 매일 오전 3시에 갱신 스크립트 실행
2. **Certbot Renew**: 만료 30일 전부터 갱신 시도
3. **Webroot 방식**: `nginx.prod.conf`의 `/.well-known/acme-challenge/` 경로 사용
4. **Nginx Reload**: 갱신 성공 시 nginx 컨테이너 reload

## 주의사항

- Let's Encrypt는 일주일에 5회 갱신 제한이 있으므로 너무 자주 실행하지 말 것
- Certbot은 만료 30일 이내에만 실제 갱신 수행 (안전)
- `--dry-run` 테스트는 제한 없음

## Troubleshooting

### 갱신 실패 시

```bash
# 에러 로그 확인
sudo certbot renew --webroot --webroot-path=/var/www/certbot -v

# Nginx 설정 확인
docker compose -f docker-compose.base.yml -f docker-compose.production.yml exec nginx nginx -t

# Well-known 디렉토리 권한 확인
ls -la /var/www/certbot/.well-known/
```

### 수동 갱신

```bash
sudo certbot renew --force-renewal --webroot --webroot-path=/var/www/certbot
docker compose -f docker-compose.base.yml -f docker-compose.production.yml exec nginx nginx -s reload
```
