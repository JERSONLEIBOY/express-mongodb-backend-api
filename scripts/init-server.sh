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

# 配置腾讯云 Docker 镜像加速器
echo ""
echo "配置 Docker 镜像加速器..."
sudo mkdir -p /etc/docker
cat << 'EOF' | sudo tee /etc/docker/daemon.json
{
  "registry-mirrors": ["https://mirror.ccs.tencentyun.com"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
sudo systemctl restart docker
echo "Docker 镜像加速器配置完成"

# 创建应用目录
APP_DIR="/opt/ele_admin"
sudo mkdir -p $APP_DIR/repo $APP_DIR/backups
sudo chown -R ubuntu:ubuntu $APP_DIR
echo "应用目录已创建: $APP_DIR"

# 配置防火墙
echo ""
echo "配置防火墙规则..."
if command -v ufw &> /dev/null; then
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow 22/tcp comment 'SSH'
    sudo ufw allow 3000/tcp comment 'Ele Admin App'
    sudo ufw --force enable
    sudo ufw status verbose
    echo "防火墙配置完成"
else
    echo "UFW 未安装，跳过防火墙配置"
fi

# 配置定时备份（每周日凌晨 2 点）
echo ""
echo "配置定时备份任务..."
(crontab -l 2>/dev/null | grep -v "backup-db.sh"; echo "0 2 * * 0 /opt/ele_admin/repo/scripts/backup-db.sh >> /opt/ele_admin/backups/backup.log 2>&1") | crontab -
echo "定时备份已配置: 每周日凌晨 2:00"

# 验证 Docker 服务
echo ""
echo "检查 Docker 服务状态..."
sudo systemctl is-active docker || sudo systemctl start docker
sudo systemctl enable docker

echo ""
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
echo "   - MONGO_USERNAME: MongoDB 用户名"
echo "   - MONGO_PASSWORD: MongoDB 密码"
echo ""
echo "2. 推送代码触发部署:"
echo "   git push origin main"