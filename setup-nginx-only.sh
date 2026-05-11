#!/bin/bash

# Nginx 配置脚本（适用于已部署的 Docker 应用）
echo "=== Nginx 配置脚本 ==="
echo "域名: euiadminplus.cloud-ip.cc"
echo "应用端口: 3000 (Docker)"
echo

# 检测系统类型
detect_system() {
    if [ -f /etc/redhat-release ]; then
        echo "检测到 CentOS/RHEL 系统"
        OS="centos"
    elif [ -f /etc/debian_version ]; then
        echo "检测到 Debian/Ubuntu 系统"
        OS="debian"
    else
        echo "无法识别系统类型"
        exit 1
    fi
}

# 安装 Nginx
install_nginx() {
    echo "正在安装 Nginx..."

    if [ "$OS" = "centos" ]; then
        sudo yum update -y
        sudo yum install -y epel-release
        sudo yum install -y nginx
    else
        sudo apt update
        sudo apt install -y nginx
    fi

    sudo systemctl enable nginx
    sudo systemctl start nginx

    echo "Nginx 安装完成"
}

# 配置防火墙
setup_firewall() {
    echo "正在配置防火墙..."

    if [ "$OS" = "centos" ]; then
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
    else
        sudo ufw allow 'Nginx Full'
        sudo ufw reload
    fi
}

# 创建 Nginx 配置
create_config() {
    echo "正在创建 Nginx 配置..."

    # 确保配置目录存在
    sudo mkdir -p /var/www/html

    # 创建配置文件
    cat << 'EOF' | sudo tee /etc/nginx/conf.d/api.conf
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name euiadminplus.cloud-ip.cc www.euiadminplus.cloud-ip.cc;

    # Let's Encrypt 验证路径
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # 其他请求重定向到 HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name euiadminplus.cloud-ip.cc www.euiadminplus.cloud-ip.cc;

    # SSL 证书配置（由 Certbot 自动添加）
    ssl_certificate /etc/letsencrypt/live/euiadminplus.cloud-ip.cc/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/euiadminplus.cloud-ip.cc/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # 日志
    access_log /var/log/nginx/api.access.log;
    error_log /var/log/nginx/api.error.log;

    # 反向代理到 Docker 容器
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # WebSocket 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # 请求头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    echo "✅ Nginx 配置已创建"
}

# 测试并重启 Nginx
test_restart() {
    echo "正在测试配置并重启 Nginx..."
    if sudo nginx -t; then
        echo "✅ 配置测试通过"
        sudo systemctl restart nginx
        echo "✅ Nginx 已重启"
    else
        echo "❌ 配置测试失败"
        exit 1
    fi
}

# 安装 SSL 证书
install_ssl() {
    echo "正在安装 SSL 证书..."

    if [ "$OS" = "centos" ]; then
        sudo yum install -y certbot python3-certbot-nginx
    else
        sudo apt install -y certbot python3-certbot-nginx
    fi

    # 获取证书
    if sudo certbot --nginx -d euiadminplus.cloud-ip.cc -d www.euiadminplus.cloud-ip.cc --agree-tos --no-eff-email; then
        echo "✅ SSL 证书安装成功"

        # 启用自动续期
        sudo systemctl enable certbot.timer
        sudo systemctl start certbot.timer

        # 验证续期
        sudo certbot renew --dry-run
        echo "✅ 证书自动续期已配置"
    else
        echo "⚠️  SSL 证书安装失败"
        echo "请确保："
        echo "1. DNS 记录已配置生效"
        echo "2. 服务器防火墙开放 80/443 端口"
        echo "3. 阿里云安全组已开放 80/443 端口"
    fi
}

# 检查应用状态
check_app() {
    echo
    echo "=== 应用状态检查 ==="

    # 检查 Docker
    if docker --version &> /dev/null; then
        echo "✅ Docker 运行中"

        # 检查容器
        if docker ps | grep -q "ele_admin_backend"; then
            echo "✅ 应用容器运行中"
        else
            echo "⚠️  应用容器未运行"
            echo "请检查 Docker Compose 状态："
            echo "  cd /root/express_mongoodb"
            echo "  docker-compose ps"
        fi
    else
        echo "❌ Docker 未安装"
    fi

    # 检查端口
    echo
    echo "=== 端口检查 ==="
    if netstat -tuln | grep -q ":3000"; then
        echo "✅ 端口 3000 已开放"
    else
        echo "⚠️  端口 3000 未开放"
    fi
}

# 主流程
main() {
    detect_system
    install_nginx
    setup_firewall
    create_config
    test_restart
    install_ssl
    check_app

    echo
    echo "=== 配置完成 ==="
    echo "请访问以下地址测试："
    echo "  🔗 http://euiadminplus.cloud-ip.cc (自动重定向到 HTTPS)"
    echo "  🔗 https://euiadminplus.cloud-ip.cc"
    echo
    echo "常用命令："
    echo "  sudo systemctl status nginx    # 查看 Nginx 状态"
    echo "  sudo certbot certificates      # 查看 SSL 证书"
    echo "  docker-compose logs -f        # 查看应用日志"
    echo
    echo "注意：确保阿里云安全组已开放 80/443 端口"
}

# 检查是否以 root 身份运行
if [ "$EUID" -ne 0 ]; then
    echo "请使用 root 权限运行此脚本"
    echo "命令: sudo ./setup-nginx-only.sh"
    exit 1
fi

main