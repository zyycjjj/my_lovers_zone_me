## 部署与域名问题总结

### 背景目标
- 前后端分域名访问：love.zychenyao.cn 指向前端，api.zychenyao.cn 指向后端
- Nginx 反向代理并开启 HTTPS

### 遇到的问题
- Nginx 配置通过 heredoc 写入时被截断，导致 /etc/nginx/sites-available/love 内容不完整
- 服务器未安装 Nginx，导致命令不可用
- 证书未签发前无法完成 HTTPS 配置
- DNS 里保留了旧 IP 的 A 记录，导致解析重复

### 解决步骤
- 安装 Nginx
- 重写 Nginx 配置，分域名转发到 3000/4000
- 启用站点并校验配置
- 安装 Certbot 并为两个域名签发证书
- 重载 Nginx 使 HTTPS 生效

### 关键命令记录
```bash
sudo tee /etc/nginx/sites-available/love >/dev/null <<'EOF'
server {
    listen 80;
    server_name love.zychenyao.cn;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }
}
server {
    listen 80;
    server_name api.zychenyao.cn;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/love /etc/nginx/sites-enabled/love
sudo nginx -t && sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d love.zychenyao.cn -d api.zychenyao.cn --non-interactive --agree-tos -m admin@zychenyao.cn
sudo nginx -t && sudo systemctl reload nginx
```

### 结果确认
- Certbot 签发成功并部署到 /etc/nginx/sites-enabled/love
- 证书到期时间：2026-05-28
- HTTPS 已生效：
  - https://love.zychenyao.cn
  - https://api.zychenyao.cn

### 后续建议
- 强制 HTTP 跳转 HTTPS
- 配置 HSTS 提升安全性
- 定期检查证书自动续签状态
- 加入后端健康检查与访问日志管理
