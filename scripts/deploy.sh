#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DEPLOY_HOST:-}" ]]; then echo "Missing DEPLOY_HOST"; exit 1; fi
if [[ -z "${DEPLOY_USER:-}" ]]; then echo "Missing DEPLOY_USER"; exit 1; fi
if [[ -z "${DEPLOY_PATH:-}" ]]; then echo "Missing DEPLOY_PATH"; exit 1; fi
if [[ -z "${DEPLOY_SERVICE:-}" ]]; then echo "Missing DEPLOY_SERVICE"; exit 1; fi

DEPLOY_PORT="${DEPLOY_PORT:-22}"

rsync -az --delete -e "ssh -p ${DEPLOY_PORT} -o StrictHostKeyChecking=no" dist/ uploads/ package.json pnpm-lock.yaml prisma/ .env "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"

ssh -o StrictHostKeyChecking=no -p "${DEPLOY_PORT}" "${DEPLOY_USER}@${DEPLOY_HOST}" "cd ${DEPLOY_PATH} && pnpm install --prod && pnpm prisma generate && pnpm prisma migrate deploy && sudo -n systemctl restart ${DEPLOY_SERVICE}"
