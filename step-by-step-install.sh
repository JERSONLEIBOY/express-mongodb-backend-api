#!/bin/bash

echo "=== Nginx 安装步骤 ==="

# 步骤 1: 更新系统
echo "步骤 1: 更新系统..."
sudo yum update -y

# 步骤 2: 安装 EPEL 仓库
echo "步骤 2: 安装 EPEL 仓库..."
sudo yum install -y epel-release

# 步骤 3: 安装 Nginx
echo "步骤 3: 安装 Nginx..."
sudo yum install -y nginx

# 步骤 4: 检查安装是否成功
echo "步骤 4: 检查 Nginx..."
if command -v nginx &> /dev/null; then
    echo "✅ Nginx 安装成功"
    nginx -v
else
    echo "❌ Nginx 安装失败"
    exit 1
fi

# 步骤 5: 启动服务
echo "步骤 5: 启动 Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# 步骤 6: 检查状态
echo "步骤 6: 检查 Nginx 状态..."
sudo systemctl status nginx

# 步骤 7: 配置防火墙
echo "步骤 7: 配置防火墙..."
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

echo "=== 安装完成 ==="
echo "如果需要配置域名代理，请执行："
echo "sudo mkdir -p /etc/nginx/conf.d"
echo "sudo cp nginx.conf /etc/nginx/conf.d/api.conf"
echo "sudo nginx -t"
echo "sudo systemctl restart nginx"