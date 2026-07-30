#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_DIR}"

printf '%s\n' "[1/4] JavaScript syntax"
node --check assets/js/voronoi-core.js
node --check assets/js/app.js

printf '%s\n' "[2/4] Core tests"
npm test

printf '%s\n' "[3/4] Local path and identity scan"
if grep -RInE --exclude-dir=.git --exclude='preflight.sh' '(/Users/|shogo|ishikawa|ac\.jp|nihon)' .; then
  printf '%s\n' "公開前に確認が必要な文字列が見つかりました。"
  exit 1
fi

printf '%s\n' "[4/4] Git author (if initialized)"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git log --all --format='%h  %an  <%ae>' || true
else
  printf '%s\n' "Gitリポジトリはまだ初期化されていません。"
fi

printf '%s\n' "Preflight checks passed."
