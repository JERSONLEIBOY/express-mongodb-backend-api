#!/bin/bash

# 修复 Nginx 配置脚本

echo "开始修复 Nginx 配置..."

# 1. 检查 Nginx 是否安装
if ! command -v nginx &> /dev/null; then
    echo "Nginx 未安装，正在安装..."
    sudo yum update -y  # CentOS/RHEL
    sudo yum install -y nginx  # CentOS/RHEL

    # 或者如果是 Ubuntu/Debian:
    # sudo apt update
    # sudo apt install -y nginx
fi

# 2. 创建配置目录（如果不存在）
sudo mkdir -p /etc/nginx/conf.d
sudo mkdir -p /var/log/nginx

# 3. 直接放入 conf.d 目录（兼容性更好）
sudo cp nginx.conf /etc/nginx/conf.d/api.conf

# 4. 测试配置
echo "测试 Nginx 配置..."
sudo nginx -t

# 5. 重启 Nginx
echo "重启 Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# 6. 检查状态
sudo systemctl status nginx

echo "Nginx 配置完成！"
echo "配置文件位置: /etc/nginx/conf.d/api.conf"