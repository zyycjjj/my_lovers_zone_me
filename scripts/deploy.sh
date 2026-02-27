#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DEPLOY_HOST:-}" ]]; then echo "Missing DEPLOY_HOST"; exit 1; fi
if [[ -z "${DEPLOY_USER:-}" ]]; then echo "Missing DEPLOY_USER"; exit 1; fi
if [[ -z "${DEPLOY_PATH:-}" ]]; then echo "Missing DEPLOY_PATH"; exit 1; fi
if [[ -z "${DEPLOY_SERVICE:-}" ]]; then echo "Missing DEPLOY_SERVICE"; exit 1; fi

DEPLOY_PORT="${DEPLOY_PORT:-22}"

rsync -az --delete -e "ssh -p ${DEPLOY_PORT} -o StrictHostKeyChecking=no" dist/ uploads/ package.json pnpm-lock.yaml prisma/ prisma.config.mjs .env "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"

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
  pnpm install --prod
  pnpm prisma generate
  pnpm prisma migrate deploy
  sudo -n systemctl restart ${DEPLOY_SERVICE}
"
