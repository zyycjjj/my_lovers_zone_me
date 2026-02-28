#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DEPLOY_HOST:-}" ]]; then echo "Missing DEPLOY_HOST"; exit 1; fi
if [[ -z "${DEPLOY_USER:-}" ]]; then echo "Missing DEPLOY_USER"; exit 1; fi
if [[ -z "${DEPLOY_PATH:-}" ]]; then echo "Missing DEPLOY_PATH"; exit 1; fi
if [[ -z "${DEPLOY_SERVICE:-}" ]]; then echo "Missing DEPLOY_SERVICE"; exit 1; fi

DEPLOY_PORT="${DEPLOY_PORT:-22}"

# 注意：dist 不要带尾部斜杠，否则只会同步内容，导致远端缺少 dist 目录
ssh -o StrictHostKeyChecking=no -p "${DEPLOY_PORT}" "${DEPLOY_USER}@${DEPLOY_HOST}" "sudo -n mkdir -p '${DEPLOY_PATH}' && sudo -n chown -R '${DEPLOY_USER}':'${DEPLOY_USER}' '${DEPLOY_PATH}'"
rsync -az --delete -e "ssh -p ${DEPLOY_PORT} -o StrictHostKeyChecking=no" dist uploads/ package.json pnpm-lock.yaml prisma/ prisma.config.mjs .env deploy/ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"

ssh -o StrictHostKeyChecking=no -p "${DEPLOY_PORT}" "${DEPLOY_USER}@${DEPLOY_HOST}" "DEPLOY_PATH='${DEPLOY_PATH}' DEPLOY_SERVICE='${DEPLOY_SERVICE}' bash -s" <<'REMOTE'
set -euo pipefail
export PNPM_HOME="${HOME}/.local/share/pnpm"
export PATH="${PNPM_HOME}:${PATH}"
if ! command -v pnpm >/dev/null 2>&1; then
  if command -v corepack >/dev/null 2>&1; then
    corepack enable || true
    corepack prepare pnpm@9 --activate || true
  fi
fi
if ! command -v pnpm >/dev/null 2>&1; then
  curl -fsSL https://get.pnpm.io/install.sh | SHELL=$(command -v bash) bash -s -- --version 9
  export PATH="${PNPM_HOME}:${PATH}"
fi
pnpm --version
cd "${DEPLOY_PATH}"
rm -f dist/prisma.config.js dist/prisma.config.cjs dist/prisma.config.ts || true
echo "[deploy] CWD: $(pwd)"
echo "[deploy] List root:"
ls -la || true
echo "[deploy] List prisma:"
ls -la prisma || true
if [ ! -f prisma/schema.prisma ] && [ -f schema.prisma ]; then
  echo "[deploy] Detected misplaced schema.prisma at project root. Moving into prisma/..."
  mkdir -p prisma
  mv -f schema.prisma prisma/schema.prisma
fi
if [ ! -f prisma/schema.prisma ]; then
  echo "[deploy] ERROR: prisma/schema.prisma not found in $(pwd)"
  exit 1
fi
pnpm install --prod
pnpm prisma generate --schema prisma/schema.prisma
pnpm prisma migrate deploy --schema prisma/schema.prisma
SERVICE_NAME="${DEPLOY_SERVICE:-}"
if [ -z "${SERVICE_NAME}" ]; then
  CANDIDATE=$(ls -1 deploy/*.service 2>/dev/null | head -n1 || true)
  if [ -n "${CANDIDATE}" ]; then
    SERVICE_NAME=$(basename "${CANDIDATE}" .service)
    echo "[deploy] DEPLOY_SERVICE not set, detected service name: ${SERVICE_NAME}"
  fi
fi
if [ -z "${SERVICE_NAME}" ]; then
  echo "[deploy] ERROR: service name is empty (DEPLOY_SERVICE not set and no deploy/*.service found)"
  exit 1
fi
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
SOURCE_FILE="${DEPLOY_PATH}/deploy/${SERVICE_NAME}.service"
if [ ! -f "${SOURCE_FILE}" ]; then
  ALT_SOURCE="${DEPLOY_PATH}/${SERVICE_NAME}.service"
  if [ -f "${ALT_SOURCE}" ]; then
    echo "[deploy] Fallback service file found at project root: ${ALT_SOURCE}"
    SOURCE_FILE="${ALT_SOURCE}"
  fi
fi
if [ ! -f "${SERVICE_FILE}" ]; then
  if [ -f "${SOURCE_FILE}" ]; then
    echo "[deploy] Installing systemd unit: ${SERVICE_FILE}"
    sudo -n cp "${SOURCE_FILE}" "${SERVICE_FILE}"
    sudo -n /usr/bin/systemctl daemon-reload
    sudo -n /usr/bin/systemctl enable "${SERVICE_NAME}"
  else
    echo "[deploy] ERROR: source unit not found at ${SOURCE_FILE}"
    exit 1
  fi
else
  echo "[deploy] Unit already exists: ${SERVICE_FILE}"
  sudo -n /usr/bin/systemctl daemon-reload
fi
sudo -n /usr/bin/systemctl restart "${SERVICE_NAME}"
REMOTE
