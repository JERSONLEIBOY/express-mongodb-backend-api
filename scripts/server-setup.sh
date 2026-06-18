#!/bin/bash
set -e

# ============================================================
# 服务器初始化脚本 - 腾讯云 Ubuntu 22.04 + Docker 镜像
# 用途：首次部署前在服务器上执行一次
# ============================================================

APP_NAME="ele_admin"
APP_DIR="/opt/${APP_NAME}"
GHCR_REPO="ghcr.io/jersonleiboy/express-mongodb-backend-api"

echo "=== ${APP_NAME} 服务器初始化 ==="

# 1. 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "[错误] Docker 未安装，请使用腾讯云 Docker 基础镜像或手动安装 Docker"
    exit 1
fi

# 2. 检查 Docker Compose
if ! docker compose version &> /dev/null; then
    echo "[错误] Docker Compose V2 未安装"
    echo "请执行: apt-get update && apt-get install -y docker-compose-plugin"
    exit 1
fi

echo "[1/5] Docker 环境检查通过"

# 3. 登录 GHCR（公共仓库可跳过，私有仓库需要）
echo "[2/5] 配置 GHCR 镜像仓库登录..."
if [ -n "$GHCR_TOKEN" ] && [ -n "$GHCR_USER" ]; then
    echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
    echo "[2/5] GHCR 登录成功"
else
    echo "[2/5] GHCR 登录已跳过（公共仓库无需登录）"
fi

# 4. 创建部署目录
echo "[3/5] 创建部署目录..."
mkdir -p "${APP_DIR}"
mkdir -p "${APP_DIR}/backup"
mkdir -p "${APP_DIR}/logs"
cd "${APP_DIR}"

# 5. 下载 docker-compose.yml
echo "[4/5] 下载配置文件..."
curl -fsSL "https://raw.githubusercontent.com/JERSONLEIBOY/express-mongodb-backend-api/main/docker-compose.yml" \
    -o docker-compose.yml

# 6. 创建生产环境 .env
if [ ! -f .env ]; then
    echo "[5/5] 创建生产环境配置文件..."
    JWT_SECRET=$(openssl rand -hex 32)
    cat > .env <<EOF
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://mongodb:27017/ele_admin
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
LOG_RETENTION_DAYS=30
RESPONSE_TIME_ZONE=Asia/Shanghai
UPLOAD_MAX_SIZE=10485760
EOF
    echo "[5/5] .env 已创建，JWT_SECRET 已自动生成"
    echo "[提示] 请根据需要修改 CORS_ORIGIN 等配置"
else
    echo "[5/5] .env 已存在，跳过创建"
fi

# 7. 首次拉取并启动
echo "=== 首次拉取镜像并启动服务 ==="
docker compose pull
docker compose up -d

echo ""
echo "=== 初始化完成 ==="
echo "部署目录: ${APP_DIR}"
echo "查看日志: cd ${APP_DIR} && docker compose logs -f"
echo "健康检查: curl http://localhost:3000/health"
echo ""
echo "请将以下 GitHub Secrets 配置到仓库中:"
echo "  SERVER_HOST: $(curl -s http://checkip.amazonaws.com)"
echo "  SERVER_USER: $(whoami)"
echo "  SERVER_PORT: 22"
