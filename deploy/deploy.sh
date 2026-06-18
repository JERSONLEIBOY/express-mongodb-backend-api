#!/bin/bash

# ============================================
# 服务器初始化脚本
# 在腾讯云 Ubuntu 22.04 上执行一次即可
# ============================================

set -e

DEPLOY_DIR="/home/ubuntu/ele_admin"

echo "🚀 开始初始化服务器..."

# 1. 更新系统
echo "📦 更新系统包..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. 安装 Docker（如果未安装）
if ! command -v docker &> /dev/null; then
  echo "🐳 安装 Docker..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker $USER
  echo "⚠️  Docker 已安装，请退出并重新登录以使 docker 组生效，然后重新运行此脚本"
  exit 0
fi
echo "✅ Docker: $(docker --version)"

# 3. 安装 Docker Compose 插件（如果未安装）
if ! docker compose version &> /dev/null; then
  echo "📦 安装 Docker Compose 插件..."
  sudo apt-get install -y docker-compose-plugin
fi
echo "✅ Docker Compose: $(docker compose version --short)"

# 4. 安装 git（如果未安装）
if ! command -v git &> /dev/null; then
  sudo apt-get install -y git
fi

# 5. 克隆或更新代码
echo "📁 准备部署目录: $DEPLOY_DIR"
if [ -d "$DEPLOY_DIR/.git" ]; then
  echo "📥 更新代码..."
  cd "$DEPLOY_DIR" && git pull origin main
else
  echo "📥 克隆代码..."
  git clone https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "YOUR_GITHUB_USER/express-mongodb-backend-api") "$DEPLOY_DIR"
  cd "$DEPLOY_DIR"
fi

# 6. 复制生产 docker-compose 文件
echo "📋 配置 docker-compose..."
cp deploy/docker-compose.prod.yml docker-compose.yml

# 7. 创建 .env 文件（首次）
if [ ! -f ".env" ]; then
  echo "📝 创建 .env 文件..."
  JWT_SECRET=$(openssl rand -hex 32)
  cat > .env << EOF
# JWT 密钥（已自动生成强随机字符串）
JWT_SECRET=${JWT_SECRET}

# 可选配置
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
LOG_RETENTION_DAYS=30
RESPONSE_TIME_ZONE=Asia/Shanghai
UPLOAD_MAX_SIZE=10485760
EOF
  echo "✅ JWT_SECRET 已自动生成"
fi

# 8. 创建必要目录
mkdir -p backup logs

# 9. 启动 MongoDB（先启动，为数据还原做准备）
echo "🐳 拉取镜像并启动 MongoDB..."
docker compose pull
docker compose up -d mongodb

# 等待 MongoDB 就绪
echo "⏳ 等待 MongoDB 就绪..."
until docker compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" &>/dev/null; do
  sleep 2
done
echo "✅ MongoDB 已就绪"

# 10. 还原数据库备份（如果存在）
if [ -d "backup/extract/mongo-backup/ele_admin" ]; then
  echo "📦 检测到数据库备份，开始还原..."
  bash deploy/restore-db.sh
fi

# 11. 启动应用服务
echo "🚀 启动应用服务..."
docker compose up -d

echo ""
echo "============================================"
echo "✅ 部署完成！"
echo "============================================"
docker compose ps
echo ""
echo "📝 查看日志:   docker compose logs -f"
echo "📝 编辑配置:   nano $DEPLOY_DIR/.env"
echo "📝 还原数据库: bash deploy/restore-db.sh"
