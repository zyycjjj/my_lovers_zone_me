#!/usr/bin/env bash
set -euo pipefail

# 说明：
# 在服务器上以 ubuntu 用户执行本脚本，准备 Nginx + HTTPS（love.zychenyao.cn）。
# 仅首装需要运行一次；后续更新站点配置只需复制并 reload。

DOMAIN="${DOMAIN:-love.zychenyao.cn}"
SITE_SRC="${SITE_SRC:-/srv/my_lovers_zone_me/deploy/nginx/love.conf}"
SITE_DST="/etc/nginx/sites-available/love"

if ! command -v nginx >/dev/null 2>&1; then
  sudo apt update
  sudo apt install -y nginx
fi

echo "[nginx] Copy site config"
if [ ! -f "${SITE_SRC}" ]; then
  echo "Site config not found: ${SITE_SRC}"
  exit 1
fi
sudo cp "${SITE_SRC}" "${SITE_DST}"
sudo ln -sf "${SITE_DST}" "/etc/nginx/sites-enabled/love"
sudo nginx -t
sudo systemctl reload nginx

# 可选：安装并签发 HTTPS 证书（需域名已解析到本机）
if ! command -v certbot >/dev/null 2>&1; then
  sudo apt install -y certbot python3-certbot-nginx
fi

echo "[nginx] Issue or renew certificate for ${DOMAIN}"
sudo certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m admin@"${DOMAIN}" || true
sudo systemctl reload nginx

echo "[nginx] Done."

