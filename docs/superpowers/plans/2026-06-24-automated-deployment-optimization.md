# 自动化部署优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化自动化部署流程，部署时间从 5-10 分钟降低到 1-2 分钟，支持版本管理和快速回滚

**Architecture:** 保持当前"SCP 传代码 + 服务器本地构建"架构，通过配置国内镜像源、Docker BuildKit 缓存、多阶段构建来加速。引入镜像版本标签（commit SHA）、自动清理策略实现回滚能力。添加 Watchtower 容器监控和定时数据库备份。

**Tech Stack:** Docker, Docker Compose, GitHub Actions, MongoDB (mongodump), bash

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `docker/Dockerfile` | 修改 | 多阶段构建、npm 镜像源、层缓存优化 |
| `.github/workflows/deploy.yml` | 修改 | 版本标签、镜像清理、改进健康检查、注入环境变量 |
| `docker-compose.yml` | 修改 | IMAGE_TAG 支持、Watchtower 服务、日志轮转 |
| `scripts/init-server.sh` | 修改 | 添加 Docker 镜像源配置、防火墙规则 |
| `scripts/rollback.sh` | 创建 | 列出版本、交互选择、切换镜像标签并重启 |
| `scripts/backup-db.sh` | 修改 | 压缩备份、保留策略、cron 支持 |
| `scripts/restore-db.sh` | 创建 | 从备份文件恢复 MongoDB |

---

### Task 1: 优化 Dockerfile（多阶段构建 + 国内镜像源）

**Files:**
- Modify: `docker/Dockerfile`（全文件替换）

- [ ] **Step 1: 编写优化后的 Dockerfile**

```dockerfile
# ===== 阶段 1: 安装依赖 =====
FROM node:18-alpine AS deps

WORKDIR /app

# 配置 npm 国内镜像源
RUN npm config set registry https://registry.npmmirror.com

# 先复制 package.json（变化频率低，利于缓存）
COPY package*.json ./

# 安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# ===== 阶段 2: 运行时镜像 =====
FROM node:18-alpine AS runner

WORKDIR /app

# 从 deps 阶段复制 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制应用代码
COPY src/ ./src/
COPY .env.example .env

# 创建 uploads 目录
RUN mkdir -p src/uploads && chmod 755 src/uploads

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "src/app.js"]
```

- [ ] **Step 2: 验证 Docker 构建**

Run: `docker build -f docker/Dockerfile -t test-optimized:latest .`
Expected: 构建成功，输出类似 `Successfully built <sha>`

---

### Task 2: 更新 GitHub Actions Workflow（版本标签 + 镜像清理 + 健康检查改进）

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: 编写优化后的部署 workflow**

```yaml
name: Deploy to Server

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  IMAGE_NAME: ele_admin_backend

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Generate version tag
        id: version
        run: echo "tag=commit-$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT

      - name: Copy code to server
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          port: ${{ secrets.SERVER_PORT || 22 }}
          source: ".git,.,!.git,!node_modules,!backup,!logs"
          target: /opt/ele_admin/repo

      - name: Build and deploy on server
        uses: appleboy/ssh-action@v1
        env:
          COMMIT_TAG: ${{ steps.version.outputs.tag }}
          IMAGE_NAME: ele_admin_backend
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          CORS_ORIGIN: ${{ secrets.CORS_ORIGIN }}
          MONGO_USERNAME: ${{ secrets.MONGO_USERNAME }}
          MONGO_PASSWORD: ${{ secrets.MONGO_PASSWORD }}
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          port: ${{ secrets.SERVER_PORT || 22 }}
          envs: COMMIT_TAG,IMAGE_NAME,JWT_SECRET,CORS_ORIGIN,MONGO_USERNAME,MONGO_PASSWORD
          script: |
            set -e
            cd /opt/ele_admin/repo

            # 生成 .env 文件（包含 IMAGE_TAG 供 docker-compose 使用）
            printf 'JWT_SECRET=%s\nCORS_ORIGIN=%s\nMONGO_USERNAME=%s\nMONGO_PASSWORD=%s\nIMAGE_TAG=%s\n' \
              "$JWT_SECRET" "$CORS_ORIGIN" "$MONGO_USERNAME" "$MONGO_PASSWORD" "$COMMIT_TAG" > .env
            chmod 600 .env

            # 构建镜像（带版本标签 + latest）
            docker build \
              --tag ${IMAGE_NAME}:${COMMIT_TAG} \
              --tag ${IMAGE_NAME}:latest \
              -f docker/Dockerfile .

            # 停止并清理旧容器
            docker-compose down --remove-orphans 2>/dev/null || true
            docker rm -f ele_admin_mongodb ele_admin_backend 2>/dev/null || true

            # 启动新服务
            docker-compose up -d

            # 健康检查（最多等待 60 秒）
            echo "等待服务启动..."
            for i in $(seq 1 30); do
              if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
                echo "✅ 部署成功 (${COMMIT_TAG})"
                break
              fi
              if [ "$i" -eq 30 ]; then
                echo "❌ 服务健康检查未通过"
                docker-compose logs app --tail 50
                exit 1
              fi
              echo "等待中... ($i/30)"
              sleep 2
            done

            # 清理旧镜像（保留最近 3 个版本）
            echo "清理旧镜像..."
            docker images ${IMAGE_NAME} --format '{{.Tag}}' | grep '^commit-' \
              | sort -r | tail -n +4 | xargs -I {} docker rmi ${IMAGE_NAME}:{} 2>/dev/null || true

            # 清理 dangling 镜像
            docker image prune -f

            echo "✅ 部署完成"
```

- [ ] **Step 2: 验证 workflow 语法**

Run: `cd /Users/jersenleiboy/Desktop/project/express-mongodb-backend-api && node -e "const yaml = require('js-yaml'), fs = require('fs'); yaml.load(fs.readFileSync('.github/workflows/deploy.yml', 'utf8')); console.log('YAML 语法正确')"` 2>/dev/null || echo "如果 js-yaml 未安装，跳过验证"

---

### Task 3: 更新 docker-compose.yml（IMAGE_TAG 支持 + Watchtower + 日志轮转）

**Files:**
- Modify: `docker-compose.yml`

- [ ] **Step 1: 编写优化后的 docker-compose.yml**

```yaml
version: "3.8"

services:
  mongodb:
    image: mongo:7
    container_name: ele_admin_mongodb
    restart: unless-stopped
    ports:
      - "127.0.0.1:27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: ele_admin
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USERNAME:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD:?MONGO_PASSWORD is required}
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    image: ele_admin_backend:${IMAGE_TAG:-latest}
    container_name: ele_admin_backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      mongodb:
        condition: service_healthy
    env_file:
      - .env
    environment:
      NODE_ENV: production
      PORT: 3000
      MONGODB_URI: mongodb://${MONGO_USERNAME:-admin}:${MONGO_PASSWORD}@mongodb:27017/ele_admin?authSource=admin
      JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-key-change-in-production}
      JWT_EXPIRES_IN: 7d
      CORS_ORIGIN: ${CORS_ORIGIN:-*}
      LOG_RETENTION_DAYS: 30
      RESPONSE_TIME_ZONE: Asia/Shanghai
      UPLOAD_PATH: ./src/uploads
      UPLOAD_MAX_SIZE: 10485760
    volumes:
      - app_uploads:/app/src/uploads
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  watchtower:
    image: containrrr/watchtower
    container_name: ele_admin_watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 300 --cleanup
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "2"

volumes:
  mongodb_data:
  app_uploads:
```

- [ ] **Step 2: 验证 docker-compose 语法**

Run: `docker-compose config`（需在项目目录执行）
Expected: 输出解析后的配置，无错误

---

### Task 4: 创建快速回滚脚本

**Files:**
- Create: `scripts/rollback.sh`

- [ ] **Step 1: 编写回滚脚本**

```bash
#!/bin/bash
# ================================================
# 快速回滚脚本 - 切换 Docker 镜像版本并重启服务
# 用法:
#   ./scripts/rollback.sh            # 交互式选择版本
#   ./scripts/rollback.sh commit-abc1234  # 直接指定版本
# ================================================

set -e

IMAGE_NAME="ele_admin_backend"
COMPOSE_FILE="docker-compose.yml"

echo "=========================================="
echo "  回滚工具"
echo "=========================================="

# 获取所有可用版本（按时间倒序）
AVAILABLE_TAGS=$(docker images ${IMAGE_NAME} --format '{{.Tag}}' | grep '^commit-' | sort -r)

if [ -z "$AVAILABLE_TAGS" ]; then
  echo "❌ 未找到任何 ${IMAGE_NAME}:commit-* 版本的镜像"
  echo "   可用的镜像标签:"
  docker images ${IMAGE_NAME} --format '  - {{.Tag}}'
  exit 1
fi

# 获取当前运行版本
CURRENT_TAG=$(docker inspect --format '{{.Config.Image}}' ele_admin_backend 2>/dev/null | cut -d: -f2 || echo "unknown")

# 如果指定了版本参数
if [ -n "$1" ]; then
  TARGET_TAG="$1"
  # 验证版本是否存在
  if ! docker images ${IMAGE_NAME}:${TARGET_TAG} --format '{{.Tag}}' | grep -q "${TARGET_TAG}"; then
    echo "❌ 版本 ${TARGET_TAG} 不存在"
    echo "   可用版本:"
    echo "$AVAILABLE_TAGS"
    exit 1
  fi
else
  # 交互式选择
  echo ""
  echo "当前版本: ${CURRENT_TAG}"
  echo ""
  echo "可用版本:"
  IFS=$'\n'
  i=1
  TAGS_ARRAY=()
  for tag in $AVAILABLE_TAGS; do
    TAGS_ARRAY+=("$tag")
    echo "  [$i] ${tag}"
    i=$((i + 1))
  done

  echo ""
  read -p "请选择要回滚到的版本 [1-$((i-1))]: " selection

  if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -ge "$i" ]; then
    echo "❌ 无效选择"
    exit 1
  fi

  TARGET_TAG="${TAGS_ARRAY[$((selection-1))]}"
fi

if [ "$TARGET_TAG" = "$CURRENT_TAG" ]; then
  echo "⚠️  当前版本已是 ${TARGET_TAG}，无需回滚"
  exit 0
fi

echo ""
echo "当前版本: ${CURRENT_TAG}"
echo "目标版本: ${TARGET_TAG}"
echo ""

# 回滚前自动备份数据库
echo "⏺️  正在备份数据库..."
BACKUP_FILE="/opt/ele_admin/backups/pre-rollback-$(date +%Y%m%d-%H%M%S).gz"
docker exec ele_admin_mongodb mongodump --archive --gzip \
  -u "${MONGO_USERNAME:-admin}" -p "${MONGO_PASSWORD}" --authenticationDatabase admin \
  2>/dev/null > "$BACKUP_FILE" || echo "  ⚠️  数据库备份失败，继续回滚..."
echo "  备份已保存: ${BACKUP_FILE}"

# 切换版本
echo ""
echo "🔄 正在切换到 ${TARGET_TAG}..."
export IMAGE_TAG="${TARGET_TAG}"
docker-compose -f ${COMPOSE_FILE} up -d app

# 健康检查
echo ""
echo "⏳ 等待服务启动..."
for i in $(seq 1 15); do
  if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ 回滚成功，当前版本: ${TARGET_TAG}"
    exit 0
  fi
  echo "  等待中... ($i/15)"
  sleep 2
done

# 健康检查失败，回退到旧版本
echo "❌ 回滚后健康检查未通过，正在回退..."
export IMAGE_TAG="${CURRENT_TAG}"
docker-compose -f ${COMPOSE_FILE} up -d app
echo "⚠️  已回退到 ${CURRENT_TAG}，请检查日志: docker-compose logs app"
exit 1
```

- [ ] **Step 2: 设置可执行权限**

Run: `chmod +x /Users/jersenleiboy/Desktop/project/express-mongodb-backend-api/scripts/rollback.sh`
Expected: 无输出（成功设置权限）

- [ ] **Step 3: 验证脚本语法**

Run: `bash -n /Users/jersenleiboy/Desktop/project/express-mongodb-backend-api/scripts/rollback.sh`
Expected: 无输出（语法正确）

---

### Task 5: 更新数据库备份脚本

**Files:**
- Modify: `scripts/backup-db.sh`

- [ ] **Step 1: 编写优化后的备份脚本**

```bash
#!/bin/bash
# ================================================
# MongoDB 数据库备份脚本
# 用法:
#   ./scripts/backup-db.sh              # 立即备份
#   ./scripts/backup-db.sh /path/to/dir # 备份到指定目录
# ================================================

set -e

# 配置
MONGO_CONTAINER="ele_admin_mongodb"
MONGO_DB="ele_admin"
MONGO_USER="${MONGO_USERNAME:-admin}"
MONGO_PASS="${MONGO_PASSWORD}"
BACKUP_DIR="${1:-/opt/ele_admin/backups}"
RETENTION_DAYS=28  # 保留 4 周

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名
BACKUP_FILE="${BACKUP_DIR}/backup-$(date +%Y%m%d-%H%M%S).gz"

echo "=========================================="
echo "  数据库备份 - $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# 检查容器运行状态
if ! docker ps --format '{{.Names}}' | grep -q "^${MONGO_CONTAINER}$"; then
  echo "❌ MongoDB 容器 ${MONGO_CONTAINER} 未运行"
  exit 1
fi

# 执行备份
echo "⏺️  正在备份数据库 ${MONGO_DB}..."
if [ -n "$MONGO_PASS" ]; then
  docker exec "$MONGO_CONTAINER" mongodump \
    --db "$MONGO_DB" \
    --archive --gzip \
    -u "$MONGO_USER" -p "$MONGO_PASS" \
    --authenticationDatabase admin \
    > "$BACKUP_FILE"
else
  docker exec "$MONGO_CONTAINER" mongodump \
    --db "$MONGO_DB" \
    --archive --gzip \
    > "$BACKUP_FILE"
fi

# 验证备份文件
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "  备份完成: ${BACKUP_FILE} (${BACKUP_SIZE})"

# 清理旧备份（保留 RETENTION_DAYS 天）
echo ""
echo "🧹 清理 ${RETENTION_DAYS} 天前的备份..."
find "$BACKUP_DIR" -name "backup-*.gz" -type f -mtime +${RETENTION_DAYS} -delete
find "$BACKUP_DIR" -name "pre-rollback-*.gz" -type f -mtime +${RETENTION_DAYS} -delete

# 显示保留的备份
echo ""
echo "当前保留的备份:"
ls -lh "$BACKUP_DIR"/*.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}' || echo "  (无备份文件)"

echo ""
echo "✅ 备份完成"
```

- [ ] **Step 2: 设置可执行权限**

Run: `chmod +x /Users/jersenleiboy/Desktop/project/express-mongodb-backend-api/scripts/backup-db.sh`
Expected: 无输出

- [ ] **Step 3: 验证脚本语法**

Run: `bash -n /Users/jersenleiboy/Desktop/project/express-mongodb-backend-api/scripts/backup-db.sh`
Expected: 无输出

---

### Task 6: 创建数据库恢复脚本

**Files:**
- Create: `scripts/restore-db.sh`

- [ ] **Step 1: 编写恢复脚本**

```bash
#!/bin/bash
# ================================================
# MongoDB 数据库恢复脚本
# 用法:
#   ./scripts/restore-db.sh <backup-file>
# 示例:
#   ./scripts/restore-db.sh /opt/ele_admin/backups/backup-20260624-020000.gz
# ================================================

set -e

MONGO_CONTAINER="ele_admin_mongodb"
MONGO_DB="ele_admin"
MONGO_USER="${MONGO_USERNAME:-admin}"
MONGO_PASS="${MONGO_PASSWORD}"

echo "=========================================="
echo "  数据库恢复"
echo "=========================================="

# 检查参数
if [ -z "$1" ]; then
  echo "❌ 用法: $0 <backup-file>"
  echo ""
  echo "可用备份:"
  ls -lh /opt/ele_admin/backups/*.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}' || echo "  (无备份文件)"
  exit 1
fi

BACKUP_FILE="$1"

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ 备份文件不存在: ${BACKUP_FILE}"
  exit 1
fi

# 检查容器运行状态
if ! docker ps --format '{{.Names}}' | grep -q "^${MONGO_CONTAINER}$"; then
  echo "❌ MongoDB 容器 ${MONGO_CONTAINER} 未运行"
  exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "备份文件: ${BACKUP_FILE} (${BACKUP_SIZE})"
echo "目标数据库: ${MONGO_DB}"
echo ""

# 确认恢复
read -p "⚠️  恢复将覆盖当前数据库 ${MONGO_DB} 的所有数据，是否继续? (y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "已取消"
  exit 0
fi

echo ""
echo "🔄 正在恢复数据库..."

# 执行恢复
if [ -n "$MONGO_PASS" ]; then
  gunzip -c "$BACKUP_FILE" | docker exec -i "$MONGO_CONTAINER" mongorestore \
    --archive \
    --nsInclude="${MONGO_DB}.*" \
    --drop \
    -u "$MONGO_USER" -p "$MONGO_PASS" \
    --authenticationDatabase admin
else
  gunzip -c "$BACKUP_FILE" | docker exec -i "$MONGO_CONTAINER" mongorestore \
    --archive \
    --nsInclude="${MONGO_DB}.*" \
    --drop
fi

echo ""
echo "✅ 数据库恢复完成"
```

- [ ] **Step 2: 设置可执行权限**

Run: `chmod +x /Users/jersenleiboy/Desktop/project/express-mongodb-backend-api/scripts/restore-db.sh`
Expected: 无输出

- [ ] **Step 3: 验证脚本语法**

Run: `bash -n /Users/jersenleiboy/Desktop/project/express-mongodb-backend-api/scripts/restore-db.sh`
Expected: 无输出

---

### Task 7: 更新服务器初始化脚本

**Files:**
- Modify: `scripts/init-server.sh`

- [ ] **Step 1: 更新初始化脚本，添加 Docker 镜像源配置和防火墙规则**

```bash
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
```

- [ ] **Step 2: 验证脚本语法**

Run: `bash -n /Users/jersenleiboy/Desktop/project/express-mongodb-backend-api/scripts/init-server.sh`
Expected: 无输出

---

### Task 8: 提交所有代码变更

- [ ] **Step 1: 提交变更**

Run:
```bash
git add docker/Dockerfile docker-compose.yml .github/workflows/deploy.yml scripts/
git commit -m "feat: 优化自动化部署流程

- Dockerfile 改为多阶段构建，添加 npm 国内镜像源
- docker-compose 添加 Watchtower 监控和日志轮转
- GitHub Actions 支持镜像版本标签和自动清理
- 添加快速回滚脚本 (scripts/rollback.sh)
- 更新数据库备份脚本，支持自动保留 4 周
- 添加数据库恢复脚本 (scripts/restore-db.sh)
- 服务器初始化脚本添加镜像加速器和防火墙配置

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
Expected: 提交成功

---

### Task 9: 服务器初始化（需用户执行）

**Files:** 无代码变更

- [ ] **Step 1: 将初始化脚本传到服务器**

```bash
scp scripts/init-server.sh ubuntu@118.25.40.64:/tmp/init-server.sh
```

- [ ] **Step 2: 在服务器上执行初始化脚本**

```bash
ssh ubuntu@118.25.40.64
sudo bash /tmp/init-server.sh
```

- [ ] **Step 3: 验证初始化结果**

```bash
ssh ubuntu@118.25.40.64
docker --version                    # 验证 Docker
docker-compose --version            # 验证 Docker Compose
cat /etc/docker/daemon.json         # 验证镜像源
sudo ufw status                     # 验证防火墙
crontab -l                          # 验证定时备份
```

---

### Task 10: 配置 GitHub Secrets

**Files:** 无代码变更

- [ ] **Step 1: 在 GitHub 仓库配置 Secrets**

进入 GitHub 仓库 → Settings → Secrets and variables → Actions → New repository secret，添加以下 secrets：

| Secret | 值 |
|--------|-----|
| `SERVER_HOST` | `118.25.40.64` |
| `SERVER_USER` | `ubuntu` |
| `SERVER_SSH_KEY` | 完整的 SSH 私钥（`cat ~/.ssh/id_rsa`） |
| `SERVER_PORT` | `22` |
| `JWT_SECRET` | 你的 JWT 密钥 |
| `CORS_ORIGIN` | `*` 或具体域名 |
| `MONGO_USERNAME` | `admin` |
| `MONGO_PASSWORD` | 你的 MongoDB 密码 |

---

### Task 11: 首次部署验证

- [ ] **Step 1: 推送代码到 main 分支触发部署**

```bash
git push origin main
```

- [ ] **Step 2: 在 GitHub Actions 页面观察部署进度**

打开 GitHub 仓库 → Actions → 点击最新的 workflow run
Expected: 所有步骤绿色通过，部署时间在 1-3 分钟

- [ ] **Step 3: 验证服务运行**

```bash
ssh ubuntu@118.25.40.64
docker ps                              # 查看运行的容器
curl http://localhost:3000/health      # 验证健康检查
docker images | grep ele_admin_backend # 查看镜像版本
```

Expected: 3 个容器运行中（mongodb、app、watchtower），健康检查返回 200

---

### Task 12: 测试回滚流程

- [ ] **Step 1: 在服务器上测试回滚脚本**

```bash
ssh ubuntu@118.25.40.64
cd /opt/ele_admin/repo

# 查看当前版本
docker inspect --format '{{.Config.Image}}' ele_admin_backend

# 列出可用版本
bash scripts/rollback.sh
```

Expected: 显示当前版本和可用版本列表

- [ ] **Step 2: 指定版本回滚测试**

```bash
# 获取上一个版本的 tag
docker images ele_admin_backend --format '{{.Tag}}' | grep '^commit-' | sort -r

# 回滚到指定版本
bash scripts/rollback.sh commit-<上一個版本SHA>
```

Expected: 回滚成功，健康检查通过，服务恢复正常

- [ ] **Step 3: 回滚到最新版本**

```bash
bash scripts/rollback.sh commit-<最新版本SHA>
```

Expected: 成功回到最新版本

---

### Task 13: 测试备份和恢复

- [ ] **Step 1: 测试手动备份**

```bash
ssh ubuntu@118.25.40.64
cd /opt/ele_admin/repo
bash scripts/backup-db.sh
```

Expected: 备份成功，备份文件生成在 `/opt/ele_admin/backups/`

- [ ] **Step 2: 验证备份文件完整性**

```bash
ls -lh /opt/ele_admin/backups/
# 检查备份文件是否能正常解压
gunzip -c /opt/ele_admin/backups/backup-*.gz | head -c 100
```

Expected: 备份文件存在，可正常读取

- [ ] **Step 3: 验证定时备份配置**

```bash
crontab -l
```

Expected: 显示 `0 2 * * 0 /opt/ele_admin/repo/scripts/backup-db.sh ...`