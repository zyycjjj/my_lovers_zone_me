#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DEPLOY_HOST:-}" ]]; then echo "Missing DEPLOY_HOST"; exit 1; fi
if [[ -z "${DEPLOY_USER:-}" ]]; then echo "Missing DEPLOY_USER"; exit 1; fi
if [[ -z "${DEPLOY_PATH:-}" ]]; then echo "Missing DEPLOY_PATH"; exit 1; fi
if [[ -z "${DEPLOY_SERVICE:-}" ]]; then echo "Missing DEPLOY_SERVICE"; exit 1; fi

rsync -az --delete dist/ uploads/ package.json pnpm-lock.yaml prisma/ .env "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"

ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "cd ${DEPLOY_PATH} && pnpm install --prod && pnpm prisma generate && pnpm prisma migrate deploy && sudo systemctl restart ${DEPLOY_SERVICE}"
