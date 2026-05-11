#!/bin/bash

# SSL 证书安装脚本
# 用于为 euiadminplus.cloud-ip.cc 获取免费 Let's Encrypt 证书

echo "开始安装 SSL 证书..."

# 更新系统
sudo apt update

# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
echo "正在获取 SSL 证书..."
sudo certbot --nginx -d euiadminplus.cloud-ip.cc -d www.euiadminplus.cloud-ip.cc --email your-email@example.com --agree-tos --no-eff-email

# 启用自动续期
sudo systemctl enable certbot.timer

echo "SSL 证书安装完成！"
echo "证书路径: /etc/letsencrypt/live/euiadminplus.cloud-ip.cc/"
echo "测试 HTTPS 访问: https://euiadminplus.cloud-ip.cc"