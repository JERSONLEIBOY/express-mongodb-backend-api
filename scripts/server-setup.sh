#!/bin/bash

# 服务器初始化脚本
# 在腾讯云服务器上首次部署时运行

set -e

echo "=========================================="
echo "Express MongoDB Backend API - 服务器初始化"
echo "=========================================="

# 配置变量
APP_DIR="/opt/express-mongodb-backend-api"
GITHUB_REPO="${1:-username/express-mongodb-backend-api}"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 docker-compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "安装 docker-compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "✅ Docker 环境检查通过"

# 创建应用目录
echo "创建应用目录: ${APP_DIR}"
sudo mkdir -p ${APP_DIR}
sudo chown -R $USER:$USER ${APP_DIR}
cd ${APP_DIR}

# 创建必要的子目录
mkdir -p backup scripts logs

# 下载配置文件（从仓库）
echo "下载配置文件..."
curl -o docker-compose.yml https://raw.githubusercontent.com/${GITHUB_REPO}/main/docker-compose.yml
curl -o scripts/backup-db.sh https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/backup-db.sh
curl -o scripts/restore-db.sh https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/restore-db.sh

# 设置脚本执行权限
chmod +x scripts/*.sh

# 创建 .env 文件
if [ ! -f .env ]; then
    echo "创建 .env 配置文件..."
    cat > .env <<EOF
# GitHub 仓库（用于 docker-compose.yml 中的镜像名称）
GITHUB_REPOSITORY=${GITHUB_REPO}

# JWT 配置（请修改为强随机密钥！）
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

# CORS 配置（生产环境请设置为具体域名）
CORS_ORIGIN=*

# 日志保留天数
LOG_RETENTION_DAYS=30

# 时区
RESPONSE_TIME_ZONE=Asia/Shanghai

# 文件上传大小限制（字节）
UPLOAD_MAX_SIZE=10485760
EOF
    echo "✅ .env 文件已创建，请根据实际情况修改"
else
    echo "⚠️  .env 文件已存在，跳过创建"
fi

# 配置定时备份（每天凌晨 2 点）
echo "配置数据库定时备份..."
CRON_JOB="0 2 * * * ${APP_DIR}/scripts/backup-db.sh >> ${APP_DIR}/logs/backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v backup-db.sh; echo "$CRON_JOB") | crontab -

echo ""
echo "=========================================="
echo "✅ 服务器初始化完成！"
echo "=========================================="
echo ""
echo "下一步操作："
echo "1. 编辑 ${APP_DIR}/.env 文件，修改配置"
echo "2. 在 GitHub 仓库设置中配置 Secrets:"
echo "   - SERVER_HOST: 服务器 IP"
echo "   - SERVER_USER: SSH 用户名"
echo "   - SERVER_SSH_KEY: SSH 私钥"
echo "   - SERVER_PORT: SSH 端口（默认 22）"
echo "3. 推送代码到 main 分支，触发自动部署"
echo ""
echo "手动部署命令："
echo "  cd ${APP_DIR}"
echo "  docker-compose up -d"
echo ""
echo "查看日志："
echo "  docker-compose logs -f app"
echo ""
echo "数据库备份："
echo "  ${APP_DIR}/scripts/backup-db.sh"
echo ""
