#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DEPLOY_HOST:-}" ]]; then echo "Missing DEPLOY_HOST"; exit 1; fi
if [[ -z "${DEPLOY_USER:-}" ]]; then echo "Missing DEPLOY_USER"; exit 1; fi
if [[ -z "${DEPLOY_PATH:-}" ]]; then echo "Missing DEPLOY_PATH"; exit 1; fi
if [[ -z "${DEPLOY_SERVICE:-}" ]]; then echo "Missing DEPLOY_SERVICE"; exit 1; fi

DEPLOY_PORT="${DEPLOY_PORT:-22}"

rsync -az --delete -e "ssh -p ${DEPLOY_PORT} -o StrictHostKeyChecking=no" dist/ uploads/ package.json pnpm-lock.yaml prisma/ prisma.config.mjs .env deploy/ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"

ssh -o StrictHostKeyChecking=no -p "${DEPLOY_PORT}" "${DEPLOY_USER}@${DEPLOY_HOST}" "
  set -euo pipefail
  export PNPM_HOME=\"\${HOME}/.local/share/pnpm\"
  export PATH=\"\${PNPM_HOME}:\${PATH}\"
  if ! command -v pnpm >/dev/null 2>&1; then
    if command -v corepack >/dev/null 2>&1; then
      corepack enable || true
      corepack prepare pnpm@9 --activate || true
    fi
  fi
  if ! command -v pnpm >/dev/null 2>&1; then
    curl -fsSL https://get.pnpm.io/install.sh | SHELL=\$(command -v bash) bash -s -- --version 9
    export PATH=\"\${PNPM_HOME}:\${PATH}\"
  fi
  pnpm --version
  cd ${DEPLOY_PATH}
  # 清理可能存在的 dist 中的 prisma.config.js 避免 Prisma 误读
  rm -f dist/prisma.config.js dist/prisma.config.cjs dist/prisma.config.ts || true
  echo \"[deploy] CWD: \$(pwd)\"
  echo \"[deploy] List root:\"
  ls -la || true
  echo \"[deploy] List prisma:\"
  ls -la prisma || true
  if [ ! -f prisma/schema.prisma ] && [ -f schema.prisma ]; then
    echo \"[deploy] Detected misplaced schema.prisma at project root. Moving into prisma/...\"
    mkdir -p prisma
    mv -f schema.prisma prisma/schema.prisma
  fi
  if [ ! -f prisma/schema.prisma ]; then
    echo \"[deploy] ERROR: prisma/schema.prisma not found in \$(pwd)\"
    exit 1
  fi
  pnpm install --prod
  pnpm prisma generate --schema prisma/schema.prisma
  pnpm prisma migrate deploy --schema prisma/schema.prisma
  sudo -n systemctl restart ${DEPLOY_SERVICE}
"
