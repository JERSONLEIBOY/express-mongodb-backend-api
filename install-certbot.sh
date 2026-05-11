#!/bin/bash
# 安装 Certbot
apt update
apt install -y certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d your-domain.com

# 自动续期
systemctl enable certbot.timer
