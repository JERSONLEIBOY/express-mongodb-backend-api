#!/bin/bash

# Nginx 安装和配置脚本

echo "=== Nginx 安装和配置脚本 ==="
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
}

# 创建配置
setup_config() {
    echo "正在配置 Nginx..."

    # 确保配置目录存在
    sudo mkdir -p /etc/nginx/conf.d
    sudo mkdir -p /var/log/nginx

    # 备份原有配置
    if [ -f /etc/nginx/conf.d/api.conf ]; then
        sudo mv /etc/nginx/conf.d/api.conf /etc/nginx/conf.d/api.conf.bak
    fi

    # 复制配置文件
    sudo cp nginx.conf /etc/nginx/conf.d/api.conf

    # 测试配置
    if sudo nginx -t; then
        echo "Nginx 配置测试通过"
        sudo systemctl restart nginx
        echo "Nginx 已重启"
    else
        echo "Nginx 配置测试失败"
        exit 1
    fi
}

# 开放防火墙端口
setup_firewall() {
    echo "正在配置防火墙..."

    if [ "$OS" = "centos" ]; then
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
        echo "防火墙已开放 HTTP/HTTPS"
    else
        sudo ufw allow 'Nginx Full'
        echo "防火墙已开放 HTTP/HTTPS"
    fi
}

# 主流程
detect_system
install_nginx
setup_config
setup_firewall

echo
echo "=== 安装完成 ==="
echo "请访问以下地址测试："
echo "http://euiadminplus.cloud-ip.cc"
echo
echo "如果需要安装 SSL 证书，请运行："
echo "sudo ./install-ssl.sh"