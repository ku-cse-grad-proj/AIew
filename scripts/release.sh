#!/bin/bash

set -e

# Remote 동기화 확인
git fetch origin

if ! git diff --quiet develop origin/develop; then
  echo "❌ 로컬 develop이 remote와 다릅니다."
  echo "   git pull 또는 git push 먼저 실행하세요."
  exit 1
fi

# 작업 중인 변경사항 임시 저장
git stash --include-untracked

# main으로 이동 후 머지
git switch main
git merge origin/develop --no-ff -m "chore: release $(TZ=Asia/Seoul date +%Y-%m-%d_%H:%M)"

# Push (CD 트리거)
git push origin main

# 원래 브랜치로 복귀 및 stash 복원
git switch -
git stash pop 2>/dev/null || true

echo "✅ 배포 완료"