#!/bin/bash
set -e

# ============================================================
# 服务器初始化脚本
# 服务器环境：腾讯云 Ubuntu 22.04 LTS + Docker
# 用途：首次部署前执行一次
# ============================================================

APP_NAME="ele_admin"
APP_DIR="/opt/${APP_NAME}"
GHCR_REPO="ghcr.io/jersonleiboy/express-mongodb-backend-api"

echo "=========================================="
echo "  ${APP_NAME} 服务器初始化"
echo "=========================================="

# 1. 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "[错误] Docker 未安装"
    echo "请使用腾讯云 Docker 基础镜像，或手动安装："
    echo "  curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# 2. 检查 Docker Compose
if ! docker compose version &> /dev/null; then
    echo "[错误] Docker Compose V2 未安装"
    echo "请执行: apt-get update && apt-get install -y docker-compose-plugin"
    exit 1
fi

echo "[1/6] Docker 环境检查通过 ✓"

# 3. 登录 GHCR（公共仓库可跳过）
echo "[2/6] 配置 GHCR 镜像仓库..."
if [ -n "$GHCR_TOKEN" ] && [ -n "$GHCR_USER" ]; then
    echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
    echo "[2/6] GHCR 登录成功 ✓"
else
    echo "[2/6] GHCR 登录已跳过（公共仓库无需认证）"
fi

# 4. 创建部署目录
echo "[3/6] 创建部署目录..."
mkdir -p "${APP_DIR}/backup"
mkdir -p "${APP_DIR}/logs"
mkdir -p "${APP_DIR}/scripts"
echo "[3/6] 目录创建完成 ✓"

# 5. 下载 docker-compose.yml
echo "[4/6] 下载配置文件..."
cd "${APP_DIR}"
curl -fsSL "https://raw.githubusercontent.com/JERSONLEIBOY/express-mongodb-backend-api/main/docker-compose.yml" \
    -o docker-compose.yml
echo "[4/6] docker-compose.yml 已下载 ✓"

# 6. 创建生产环境 .env
if [ ! -f .env ]; then
    echo "[5/6] 创建生产环境配置文件..."
    JWT_SECRET=$(openssl rand -hex 32)
    cat > .env <<EOF
# 生产环境配置
NODE_ENV=production
PORT=3000

# MongoDB
MONGODB_URI=mongodb://mongodb:27017/ele_admin

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# CORS（生产环境建议设为具体域名）
CORS_ORIGIN=*

# 日志
LOG_RETENTION_DAYS=30
RESPONSE_TIME_ZONE=Asia/Shanghai

# 上传
UPLOAD_MAX_SIZE=10485760
EOF
    echo "[5/6] .env 已创建（JWT_SECRET 自动生成）✓"
    echo "[提示] 请根据需要修改 CORS_ORIGIN 等配置"
else
    echo "[5/6] .env 已存在，跳过创建"
fi

# 7. 记录服务器 IP
echo "[6/6] 服务器信息..."
SERVER_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || curl -s http://icanhazip.com 2>/dev/null)
echo "[6/6] 服务器公网 IP: ${SERVER_IP:-无法获取}"
echo "[6/6] 初始化完成 ✓"

echo ""
echo "=========================================="
echo "  初始化完成！"
echo "=========================================="
echo ""
echo "部署目录: ${APP_DIR}"
echo ""
echo "后续步骤："
echo "1. 配置 GitHub Secrets："
echo "   - SERVER_HOST: ${SERVER_IP:-<服务器IP>}"
echo "   - SERVER_USER: $(whoami)"
echo "   - SERVER_PORT: 22"
echo "   - SERVER_SSH_KEY: <SSH私钥>"
echo ""
echo "2. 手动启动服务（如需）："
echo "   cd ${APP_DIR}"
echo "   IMAGE_TAG=latest docker compose up -d"
echo ""
echo "3. 查看日志："
echo "   docker compose logs -f"
echo ""
echo "4. 健康检查："
echo "   curl http://localhost:3000/health"
echo ""
