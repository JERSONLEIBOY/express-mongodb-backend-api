#!/bin/bash
# ============================================
# 伺服器一次性初始化腳本
# 在騰訊雲 Ubuntu 伺服器上執行一次即可
# 用法: bash deploy/init-server.sh
# ============================================

set -e

DEPLOY_USER="${SUDO_USER:-$USER}"
DEPLOY_DIR="/home/${DEPLOY_USER}/ele_admin"
GITHUB_REPO="${1:-jersenleiboy/express-mongodb-backend-api}"

echo "============================================"
echo "  騰訊雲伺服器初始化腳本"
echo "============================================"
echo ""

# 檢查是否以 root 執行
if [ "$(id -u)" -eq 0 ]; then
  echo "⚠️  請勿以 root 執行此腳本"
  echo "   使用普通用戶執行，需要 sudo 時會提示"
  exit 1
fi

# 1. 更新系統
echo "📦 [1/7] 更新系統包..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. 安裝 Docker
echo "🐳 [2/7] 安裝 Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$DEPLOY_USER"
  echo "⚠️  已將用戶 ${DEPLOY_USER} 加入 docker 組"
  echo "   請退出並重新登入使組權限生效，然後重新執行此腳本"
  echo "   或執行: newgrp docker"
  exit 0
fi
echo "✅ Docker: $(docker --version)"

# 3. 安裝 Docker Compose 插件
echo "📦 [3/7] 安裝 Docker Compose 插件..."
if ! docker compose version &>/dev/null; then
  sudo apt-get install -y docker-compose-plugin
fi
echo "✅ Docker Compose: $(docker compose version --short)"

# 4. 配置 Docker 鏡像加速（選擇性）
echo "🔧 [4/7] 配置 Docker 鏡像加速..."
if [ ! -f /etc/docker/daemon.json ]; then
  sudo mkdir -p /etc/docker
  cat << 'DAEMONJSON' | sudo tee /etc/docker/daemon.json > /dev/null
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
DAEMONJSON
  sudo systemctl daemon-reload
  sudo systemctl restart docker
  echo "✅ Docker 鏡像加速已配置"
else
  echo "⏭️  /etc/docker/daemon.json 已存在，跳過"
fi

# 5. 安裝 git
echo "📁 [5/7] 安裝 git..."
if ! command -v git &>/dev/null; then
  sudo apt-get install -y git
fi
echo "✅ Git: $(git --version)"

# 6. 獲取部署文件
echo "📥 [6/7] 獲取部署文件..."
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

if [ -d ".git" ]; then
  echo "📥 更新代碼..."
  git pull origin main
else
  echo "📥 克隆代碼..."
  git clone --depth 1 "https://github.com/${GITHUB_REPO}.git" /tmp/ele_admin_repo
  cp /tmp/ele_admin_repo/docker-compose.yml "$DEPLOY_DIR/"
  cp -r /tmp/ele_admin_repo/backup "$DEPLOY_DIR/" 2>/dev/null || true
  rm -rf /tmp/ele_admin_repo
fi

# 7. 創建 .env（首次）
echo "🔑 [7/7] 創建 .env 文件..."
if [ ! -f ".env" ]; then
  JWT_SECRET=$(openssl rand -hex 32)
  cat > .env << EOF
# JWT 配置
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=*

# 日誌
LOG_RETENTION_DAYS=30
RESPONSE_TIME_ZONE=Asia/Shanghai

# 上傳
UPLOAD_MAX_SIZE=10485760
EOF
  echo "✅ JWT_SECRET 已自動生成"
else
  echo "⏭️  .env 已存在，跳過"
fi

# 創建必要目錄
mkdir -p backup logs

echo ""
echo "============================================"
echo "✅ 伺服器初始化完成！"
echo "============================================"
echo ""
echo "下一步："
echo "  1. 確認腳本開頭的 docker 組提示"
echo "  2. 推送代碼到 GitHub main 分支即可觸發自動部署"
echo ""
echo "目錄結構："
ls -la "$DEPLOY_DIR"