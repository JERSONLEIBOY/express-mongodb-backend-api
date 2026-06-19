#!/bin/bash
# 服务器初始化脚本
# 用于首次部署时配置服务器环境

set -e

echo "===== 服务器初始化 ====="

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "Docker 未安装，正在安装..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker ubuntu
    echo "Docker 安装完成"
else
    echo "Docker 已安装: $(docker --version)"
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose 未安装，正在安装..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose 安装完成"
else
    echo "Docker Compose 已安装: $(docker-compose --version)"
fi

# 检查 GitHub Container Registry 登录状态
if ! docker ghcr.io &> /dev/null; then
    echo "请手动登录 GHCR:"
    echo "  echo \$GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin"
fi

# 创建应用目录
APP_DIR="/opt/ele_admin"
sudo mkdir -p $APP_DIR
sudo chown -R ubuntu:ubuntu $APP_DIR
echo "应用目录已创建: $APP_DIR"

# 创建备份目录
BACKUP_DIR="/opt/ele_admin/backups"
sudo mkdir -p $BACKUP_DIR
sudo chown -R ubuntu:ubuntu $BACKUP_DIR
echo "备份目录已创建: $BACKUP_DIR"

# 验证 Docker 服务
echo "检查 Docker 服务状态..."
sudo systemctl is-active docker || sudo systemctl start docker
sudo systemctl enable docker

echo "===== 初始化完成 ====="
echo ""
echo "后续步骤:"
echo "1. 确保 GitHub Secrets 已配置:"
echo "   - SERVER_HOST: 118.25.40.64"
echo "   - SERVER_USER: ubuntu"
echo "   - SERVER_SSH_KEY: 你的 SSH 私钥"
echo "   - SERVER_PORT: 22"
echo "   - JWT_SECRET: 你的 JWT 密钥"
echo "   - CORS_ORIGIN: 允许的跨域源"
echo ""
echo "2. 推送代码触发部署:"
echo "   git push origin main"
