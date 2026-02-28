#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DEPLOY_HOST:-}" ]]; then echo "Missing DEPLOY_HOST"; exit 1; fi
if [[ -z "${DEPLOY_USER:-}" ]]; then echo "Missing DEPLOY_USER"; exit 1; fi
if [[ -z "${DEPLOY_PATH:-}" ]]; then echo "Missing DEPLOY_PATH"; exit 1; fi
if [[ -z "${DEPLOY_SERVICE:-}" ]]; then echo "Missing DEPLOY_SERVICE"; exit 1; fi

DEPLOY_PORT="${DEPLOY_PORT:-22}"
SKIP_SYSTEMCTL="${SKIP_SYSTEMCTL:-}"

# 预创建目录，避免 rsync 到根路径时报错
ssh -o StrictHostKeyChecking=no -p "${DEPLOY_PORT}" "${DEPLOY_USER}@${DEPLOY_HOST}" "
  mkdir -p '${DEPLOY_PATH}' 2>/dev/null || true
  if [ ! -d '${DEPLOY_PATH}' ]; then
    if sudo -n true 2>/dev/null; then
      sudo -n mkdir -p '${DEPLOY_PATH}' && sudo -n chown -R '${DEPLOY_USER}':'${DEPLOY_USER}' '${DEPLOY_PATH}'
    else
      echo 'SUDO_REQUIRED_FOR_DEPLOY_PATH'
      exit 1
    fi
  fi
  # 确保已有目录可写（历史上可能被 root 拥有）
  if [ ! -w '${DEPLOY_PATH}' ]; then
    if sudo -n true 2>/dev/null; then
      sudo -n chown -R '${DEPLOY_USER}':'${DEPLOY_USER}' '${DEPLOY_PATH}'
    else
      echo 'DEPLOY_PATH_NOT_WRITABLE_AND_NO_SUDO'
      exit 1
    fi
  fi
  mkdir -p '${DEPLOY_PATH}/dist' '${DEPLOY_PATH}/prisma' '${DEPLOY_PATH}/uploads' '${DEPLOY_PATH}/deploy' 2>/dev/null || true
  if sudo -n true 2>/dev/null; then
    sudo -n chown -R '${DEPLOY_USER}':'${DEPLOY_USER}' '${DEPLOY_PATH}/dist' '${DEPLOY_PATH}/prisma' '${DEPLOY_PATH}/uploads' '${DEPLOY_PATH}/deploy' || true
  fi
"
# 分目录同步，避免对根目录 --delete 导致误删 node_modules 等
# 1) dist 全量覆盖
rsync -az --delete --no-perms --no-owner --no-group \
  -e "ssh -p ${DEPLOY_PORT} -o StrictHostKeyChecking=no" \
  dist/  "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/dist/"
# 2) prisma 代码与迁移脚本（删除过期迁移）
rsync -az --delete --no-perms --no-owner --no-group \
  -e "ssh -p ${DEPLOY_PORT} -o StrictHostKeyChecking=no" \
  prisma/ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/prisma/"
# 3) uploads 不删除（保留历史文件）
rsync -az --no-perms --no-owner --no-group \
  -e "ssh -p ${DEPLOY_PORT} -o StrictHostKeyChecking=no" \
  uploads/ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/uploads/"
# 4) 其他文件
rsync -az --no-perms --no-owner --no-group \
  -e "ssh -p ${DEPLOY_PORT} -o StrictHostKeyChecking=no" \
  package.json pnpm-lock.yaml prisma.config.mjs .env "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"
rsync -az --no-perms --no-owner --no-group \
  -e "ssh -p ${DEPLOY_PORT} -o StrictHostKeyChecking=no" \
  deploy/ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/deploy/"

ssh -o StrictHostKeyChecking=no -p "${DEPLOY_PORT}" "${DEPLOY_USER}@${DEPLOY_HOST}" "DEPLOY_PATH='${DEPLOY_PATH}' DEPLOY_SERVICE='${DEPLOY_SERVICE}' SKIP_SYSTEMCTL='${SKIP_SYSTEMCTL}' bash -s" <<'REMOTE'
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
if [ -n "${SKIP_SYSTEMCTL}" ]; then
  echo "[deploy] Skipping systemctl due to SKIP_SYSTEMCTL"
  exit 0
fi
if sudo -n true 2>/dev/null; then
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
else
  echo "[deploy] ERROR: sudo requires password on target host"
  exit 1
fi
REMOTE
