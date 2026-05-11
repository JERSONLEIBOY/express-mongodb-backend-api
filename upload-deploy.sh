#!/bin/bash

# 一键上传并部署脚本
echo "=== 一键上传部署脚本 ==="

# 设置变量
SERVER_IP="8.148.145.218"
DOMAIN="euiadminplus.cloud-ip.cc"
PROJECT_NAME="express_mongoodb"

# 步骤 1: 上传文件
echo "步骤 1: 上传文件到服务器..."
scp -r "$PROJECT_NAME" root@$SERVER_IP:/root/

# 步骤 2: 登录服务器并执行部署
echo "步骤 2: 登录服务器..."
ssh -t root@$SERVER_IP << 'EOF'
    # 进入项目目录
    cd /root/express_mongoodb

    # 给脚本执行权限
    chmod +x deploy.sh

    # 执行部署
    ./deploy.sh

    # 额外检查 Docker 服务
    echo
    echo "=== Docker 状态检查 ==="
    docker --version

    # 如果 docker-compose 存在，检查应用状态
    if command -v docker-compose &> /dev/null || command -v docker compose &> /dev/null; then
        echo
        echo "=== 检查应用状态 ==="
        if [ -f docker-compose.yml ]; then
            docker-compose ps
        else
            echo "未找到 docker-compose.yml"
        fi
    fi

    echo
    echo "=== 最终检查 ==="
    echo "域名: $DOMAIN"
    echo "服务器 IP: $SERVER_IP"
    echo "请访问: https://$DOMAIN"
    echo
    echo "退出登录..."
EOF

echo
echo "=== 所有操作完成 ==="