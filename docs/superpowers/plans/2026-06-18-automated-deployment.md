# 自动化部署到腾讯云 服务器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Express + MongoDB 后端项目创建完整的自动化部署体系，支持 GitHub Actions CI/CD + 腾讯云 Ubuntu 22.04 Docker 部署。

**Architecture:** 开发者 push 到 main 分支 → GitHub Actions 构建 Docker 镜像推送到 GHCR → SSH 连接腾讯云服务器拉取新镜像并 docker compose up 重启，配合健康检查验证部署成功。同时提供数据库备份/恢复脚本和一键初始化脚本。

**Tech Stack:** GitHub Actions, Docker, Docker Compose, GHCR, SSH, mongodump/mongorestore, bash

---

## 文件结构

| 文件 | 操作 | 说明 |
|------|------|------|
| `scripts/server-setup.sh` | 创建 | 腾讯云服务器一键初始化（Docker + Compose + 部署目录 + SSH 配置） |
| `scripts/backup-db.sh` | 创建 | MongoDB 数据库备份（tar.gz 压缩，支持保留天数清理） |
| `scripts/restore-db.sh` | 创建 | MongoDB 数据库恢复 |
| `.github/workflows/deploy.yml` | 创建 | GitHub Actions CI/CD 自动部署流水线 |
| `.dockerignore` | 创建 | Docker 构建排除文件，减小镜像体积 |
| `DEPLOYMENT.md` | 创建 | 完整部署文档 |

---

### Task 1: 创建 .dockerignore

**Files:**
- Create: `.dockerignore`

- [ ] **Step 1: 创建 .dockerignore**

```dockerignore
node_modules
npm-debug.log*
logs/
.env
.env.*
!.env.example
.git
.gitignore
backup/
*.md
docker/
docker-compose.yml
pm2.config.js
src/uploads/
uploads/
.vscode/
.idea/
*.swp
*.swo
.DS_Store
```

- [ ] **Step 2: 验证 Docker 构建上下文**

Run: `docker build -f docker/Dockerfile .`
Expected: 构建成功，镜像体积减小

- [ ] **Step 3: 提交**

```bash
git add .dockerignore
git commit -m "chore: add .dockerignore to reduce build context"
```

---

### Task 2: 创建服务器初始化脚本

**Files:**
- Create: `scripts/server-setup.sh`

- [ ] **Step 1: 创建 scripts/server-setup.sh**

```bash
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

# 3. 登录 GHCR（用于拉取私有镜像）
echo "[2/5] 配置 GHCR 镜像仓库登录..."
if [ -z "$GHCR_TOKEN" ]; then
    read -s -p "请输入 GitHub Personal Access Token (需要 read:packages 权限): " GHCR_TOKEN
    echo
fi

if [ -z "$GHCR_USER" ]; then
    read -p "请输入 GitHub 用户名: " GHCR_USER
fi

echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
echo "[2/5] GHCR 登录成功"

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
```

- [ ] **Step 2: 设置可执行权限**

Run: `chmod +x scripts/server-setup.sh`

- [ ] **Step 3: 验证脚本语法**

Run: `bash -n scripts/server-setup.sh`
Expected: 无输出（语法正确）

- [ ] **Step 4: 提交**

```bash
git add scripts/server-setup.sh
git commit -m "feat: add server initialization script for Tencent Cloud"
```

---

### Task 3: 创建数据库备份脚本

**Files:**
- Create: `scripts/backup-db.sh`

- [ ] **Step 1: 创建 scripts/backup-db.sh**

```bash
#!/bin/bash
set -e

# ============================================================
# MongoDB 数据库备份脚本
# 用法: ./scripts/backup-db.sh [保留天数]
# ============================================================

BACKUP_DIR="/opt/ele_admin/backup"
CONTAINER_NAME="ele_admin_mongodb"
DB_NAME="ele_admin"
RETENTION_DAYS=${1:-7}
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${DATE}.tar.gz"
TEMP_DIR="/tmp/mongodb_backup_${DATE}"

echo "=== MongoDB 备份开始 ==="
echo "数据库: ${DB_NAME}"
echo "备份文件: ${BACKUP_FILE}"

# 执行备份
mkdir -p "${TEMP_DIR}"
docker exec "${CONTAINER_NAME}" mongodump \
    --db="${DB_NAME}" \
    --out=/tmp/mongodb_backup \
    --gzip 2>/dev/null

# 从容器复制出来
docker cp "${CONTAINER_NAME}:/tmp/mongodb_backup" "${TEMP_DIR}/dump"

# 打包压缩
tar -czf "${BACKUP_FILE}" -C "${TEMP_DIR}" .

# 清理临时文件
rm -rf "${TEMP_DIR}"
docker exec "${CONTAINER_NAME}" rm -rf /tmp/mongodb_backup

# 计算备份大小
BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "备份完成: ${BACKUP_FILE} (${BACKUP_SIZE})"

# 清理过期备份
echo "清理 ${RETENTION_DAYS} 天前的备份..."
DELETED=$(find "${BACKUP_DIR}" -name "*.tar.gz" -mtime +${RETENTION_DAYS} -print -delete | wc -l)
echo "已删除 ${DELETED} 个过期备份"

# 列出当前备份
echo ""
echo "当前备份列表:"
ls -lh "${BACKUP_DIR}"/*.tar.gz 2>/dev/null | awk '{print $9, $5}'

echo ""
echo "=== 备份完成 ==="
```

- [ ] **Step 2: 设置可执行权限**

Run: `chmod +x scripts/backup-db.sh`

- [ ] **Step 3: 验证脚本语法**

Run: `bash -n scripts/backup-db.sh`
Expected: 无输出（语法正确）

- [ ] **Step 4: 提交**

```bash
git add scripts/backup-db.sh
git commit -m "feat: add MongoDB backup script with retention policy"
```

---

### Task 4: 创建数据库恢复脚本

**Files:**
- Create: `scripts/restore-db.sh`

- [ ] **Step 1: 创建 scripts/restore-db.sh**

```bash
#!/bin/bash
set -e

# ============================================================
# MongoDB 数据库恢复脚本
# 用法: ./scripts/restore-db.sh <备份文件路径>
# 例如: ./scripts/restore-db.sh /opt/ele_admin/backup/ele_admin_backup_20260618_120000.tar.gz
# ============================================================

if [ -z "$1" ]; then
    echo "用法: $0 <备份文件路径>"
    echo "例如: $0 /opt/ele_admin/backup/ele_admin_backup_20260618_120000.tar.gz"
    echo ""
    echo "当前可用备份:"
    ls -lh /opt/ele_admin/backup/*.tar.gz 2>/dev/null | awk '{print $9, $5}'
    exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="ele_admin_mongodb"
DB_NAME="ele_admin"
TEMP_DIR="/tmp/mongodb_restore_$(date +%s)"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "[错误] 备份文件不存在: ${BACKUP_FILE}"
    exit 1
fi

echo "=== MongoDB 恢复开始 ==="
echo "备份文件: ${BACKUP_FILE}"

# 解压备份到临时目录
mkdir -p "${TEMP_DIR}"
tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"

# 检查解压后的结构
if [ ! -d "${TEMP_DIR}/dump" ]; then
    echo "[错误] 备份文件结构无效，缺少 dump 目录"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

# 复制到容器
docker cp "${TEMP_DIR}/dump" "${CONTAINER_NAME}:/tmp/restore_dump"

# 执行恢复（会覆盖现有数据）
echo "正在恢复数据库..."
docker exec "${CONTAINER_NAME}" mongorestore \
    --db="${DB_NAME}" \
    --drop \
    /tmp/restore_dump \
    --gzip 2>/dev/null

# 清理
rm -rf "${TEMP_DIR}"
docker exec "${CONTAINER_NAME}" rm -rf /tmp/restore_dump

echo ""
echo "=== 恢复完成 ==="
echo "建议重启应用: docker compose restart app"
```

- [ ] **Step 2: 设置可执行权限**

Run: `chmod +x scripts/restore-db.sh`

- [ ] **Step 3: 验证脚本语法**

Run: `bash -n scripts/restore-db.sh`
Expected: 无输出（语法正确）

- [ ] **Step 4: 提交**

```bash
git add scripts/restore-db.sh
git commit -m "feat: add MongoDB restore script"
```

---

### Task 5: 创建 GitHub Actions 自动部署流水线

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: 创建 .github/workflows/deploy.yml**

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=raw,value=latest
            type=sha,prefix=

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          port: ${{ secrets.SERVER_PORT }}
          script: |
            cd /opt/ele_admin

            echo "=== 拉取新镜像 ==="
            docker compose pull

            echo "=== 重启服务 ==="
            docker compose up -d --remove-orphans

            echo "=== 等待健康检查 ==="
            for i in $(seq 1 12); do
              if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
                echo "✅ 部署成功，服务健康"
                exit 0
              fi
              echo "等待服务启动... (${i}/12)"
              sleep 5
            done

            echo "❌ 健康检查失败，查看日志:"
            docker compose logs --tail=50
            exit 1
```

- [ ] **Step 2: 验证 YAML 语法**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))"`
Expected: 无输出（语法正确）

- [ ] **Step 3: 提交**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions automated deployment workflow"
```

---

### Task 6: 创建部署文档

**Files:**
- Create: `DEPLOYMENT.md`

- [ ] **Step 1: 创建 DEPLOYMENT.md**

```markdown
# 部署文档

## 部署架构

```
开发者 git push → GitHub (main) → GitHub Actions 触发
    → 构建 Docker 镜像 → 推送到 GHCR
    → SSH 连接腾讯云服务器
    → 拉取新镜像 → docker compose up 重启
    → 健康检查验证
```

## 首次部署

### 1. 服务器初始化

在腾讯云服务器上执行（只需一次）：

```bash
# SSH 登录服务器
ssh root@<YOUR_SERVER_IP>

# 下载初始化脚本
curl -fsSL https://raw.githubusercontent.com/JERSONLEIBOY/express-mongodb-backend-api/main/scripts/server-setup.sh -o server-setup.sh

# 执行初始化
chmod +x server-setup.sh
./server-setup.sh
```

脚本会自动完成：
- 检查 Docker 和 Docker Compose 环境
- 登录 GHCR（需要提供 GitHub Personal Access Token）
- 创建部署目录 `/opt/ele_admin`
- 下载 `docker-compose.yml`
- 生成生产环境 `.env`（JWT_SECRET 自动生成随机密钥）
- 首次拉取镜像并启动服务

### 2. 配置 GitHub Secrets

进入 GitHub 仓库 → Settings → Secrets and variables → Actions，添加：

| Secret 名称 | 值 | 说明 |
|-------------|------|------|
| `SERVER_HOST` | 服务器公网 IP | 如 `123.207.xx.xx` |
| `SERVER_USER` | SSH 用户名 | 如 `root` 或 `ubuntu` |
| `SERVER_PORT` | `22` | SSH 端口 |
| `SERVER_SSH_KEY` | SSH 私钥 | 用于自动登录服务器 |

**生成 SSH 密钥对（如已有可跳过）：**

```bash
# 在本地执行
ssh-keygen -t ed25519 -C "deploy" -f deploy_key -N ""
cat deploy_key        # 私钥 → 复制到 SERVER_SSH_KEY
cat deploy_key.pub    # 公钥 → 添加到服务器 ~/.ssh/authorized_keys
```

### 3. 启用自动部署

将代码推送到 `main` 分支即触发自动部署：

```bash
git push origin main
```

## 日常运维

### 部署状态查看

在 GitHub 仓库 → Actions 标签页查看部署状态。

### 服务器端手动操作

```bash
# SSH 登录
ssh root@<YOUR_SERVER_IP>

# 进入部署目录
cd /opt/ele_admin

# 查看服务状态
docker compose ps

# 查看实时日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down
```

### 数据库备份

```bash
# 手动备份（默认保留 7 天）
./scripts/backup-db.sh

# 指定保留天数
./scripts/backup-db.sh 30

# 备份存储位置
ls -lh /opt/ele_admin/backup/
```

**配置定时备份（可选）：**

```bash
# 添加 crontab 定时任务
crontab -e

# 每天凌晨 2 点执行备份，保留 7 天
0 2 * * * /opt/ele_admin/backup/../scripts/backup-db.sh 7 >> /opt/ele_admin/logs/backup.log 2>&1
```

### 数据库恢复

```bash
# 查看可用备份
ls -lh /opt/ele_admin/backup/*.tar.gz

# 从备份恢复
./scripts/restore-db.sh /opt/ele_admin/backup/ele_admin_backup_XXXXXXXX_XXXXXX.tar.gz

# 恢复后重启应用
docker compose restart app
```

### 回滚

如需回滚到之前的版本：

```bash
# 查看可用镜像版本（在 Actions 页面获取 SHA）
# 回滚到指定版本
docker compose down
docker pull ghcr.io/jersonleiboy/express-mongodb-backend-api:<sha>
# 修改 docker-compose.yml 中的镜像标签
docker compose up -d
```

## 环境变量说明

生产环境 `.env` 位于 `/opt/ele_admin/.env`：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NODE_ENV` | production | 运行环境 |
| `PORT` | 3000 | 服务端口 |
| `JWT_SECRET` | 自动生成 | JWT 密钥（首次初始化自动生成随机值） |
| `JWT_EXPIRES_IN` | 7d | Token 过期时间 |
| `CORS_ORIGIN` | * | CORS 白名单，生产建议设为具体域名 |
| `LOG_RETENTION_DAYS` | 30 | 日志保留天数 |

修改后重启服务：

```bash
cd /opt/ele_admin
docker compose down
docker compose up -d
```

## 常见问题

### 部署失败：健康检查超时

```bash
# 查看日志排查
cd /opt/ele_admin
docker compose logs app --tail=100
```

常见原因：
- MongoDB 未完全启动（等待 30 秒后重试）
- 环境变量配置错误（检查 `.env` 文件）

### 镜像拉取失败

```bash
# 重新登录 GHCR
docker login ghcr.io -u <GITHUB_USERNAME>
```

### 数据库连接失败

```bash
# 检查 MongoDB 容器状态
docker compose ps mongodb

# 检查 MongoDB 日志
docker compose logs mongodb --tail=50
```
```

- [ ] **Step 2: 提交**

```bash
git add DEPLOYMENT.md
git commit -m "docs: add deployment documentation"
```

---

## 自检清单

- [x] **Spec 覆盖：** GitHub Actions CI/CD ✅ / 服务器初始化脚本 ✅ / 数据库备份脚本 ✅ / 数据库恢复脚本 ✅ / .dockerignore ✅ / 部署文档 ✅
- [x] **无占位符：** 所有文件内容完整，无 TBD/TODO
- [x] **一致性：** docker-compose.yml 服务名（mongodb/app）、容器名（ele_admin_mongodb/ele_admin_backend）、部署目录（/opt/ele_admin）在所有文件中统一
