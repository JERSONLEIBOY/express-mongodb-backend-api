#!/bin/bash

# 一键部署脚本
echo "=== 域名代理部署脚本 ==="
echo "域名: euiadminplus.cloud-ip.cc"
echo "服务器 IP: 8.148.145.218"
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

    # 检查状态
    if systemctl is-active --quiet nginx; then
        echo "✅ Nginx 运行中"
    else
        echo "❌ Nginx 启动失败"
        exit 1
    fi
}

# 配置防火墙
setup_firewall() {
    echo "正在配置防火墙..."

    if [ "$OS" = "centos" ]; then
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
        echo "✅ 防火墙已开放 HTTP/HTTPS"
    else
        sudo ufw allow 'Nginx Full'
        sudo ufw reload
        echo "✅ 防火墙已开放 HTTP/HTTPS"
    fi
}

# 部署 Nginx 配置
deploy_nginx_config() {
    echo "正在部署 Nginx 配置..."

    # 确保配置目录存在
    sudo mkdir -p /var/www/html

    # 备份原有配置
    if [ -f /etc/nginx/conf.d/api.conf ]; then
        sudo mv /etc/nginx/conf.d/api.conf /etc/nginx/conf.d/api.conf.bak
        echo "已备份原有配置"
    fi

    # 复制配置文件
    sudo cp /root/nginx.conf /etc/nginx/conf.d/api.conf

    # 测试配置
    if sudo nginx -t; then
        echo "✅ Nginx 配置测试通过"
        sudo systemctl restart nginx
        echo "✅ Nginx 已重启"
    else
        echo "❌ Nginx 配置测试失败"
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
        if sudo certbot renew --dry-run; then
            echo "✅ 证书自动续期已配置"
        fi
    else
        echo "❌ SSL 证书安装失败"
        echo "请确保已配置 DNS 记录"
        exit 1
    fi
}

# 检查 DNS 解析
check_dns() {
    echo "正在检查 DNS 解析..."

    # 检查域名解析
    if nslookup euiadminplus.cloud-ip.cc | grep -q "8\.148\.145\.218"; then
        echo "✅ DNS 解析正常"
    else
        echo "⚠️  DNS 可能还未生效"
        echo "请确保 Cloudns 已添加 A 记录"
        echo "等待 5-10 分钟后重试"
    fi
}

# 主流程
main() {
    detect_system
    install_nginx
    setup_firewall
    deploy_nginx_config
    install_ssl
    check_dns

    echo
    echo "=== 部署完成 ==="
    echo "请访问以下地址测试："
    echo "  🔗 http://euiadminplus.cloud-ip.cc (自动重定向到 HTTPS)"
    echo "  🔗 https://euiadminplus.cloud-ip.cc"
    echo
    echo "常用命令："
    echo "  sudo systemctl status nginx    # 查看 Nginx 状态"
    echo "  sudo certbot certificates      # 查看 SSL 证书"
    echo "  sudo nginx -t                 # 测试 Nginx 配置"
}

# 检查是否以 root 身份运行
if [ "$EUID" -ne 0 ]; then
    echo "请使用 root 权限运行此脚本"
    echo "命令: sudo ./deploy.sh"
    exit 1
fi

# 检查是否存在 nginx.conf
if [ ! -f /root/nginx.conf ]; then
    echo "错误：未找到 nginx.conf 文件"
    echo "请先将 nginx.conf 上传到服务器的 /root 目录"
    exit 1
fi

main