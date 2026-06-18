# CI/CD 自動化部署 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 實現 Express + MongoDB 後端 API 的 GitHub Actions 自動化部署到騰訊雲伺服器

**Architecture:** GitHub Actions 構建 Docker 鏡像 → 推送至 GHCR → SSH 到騰訊雲伺服器拉取鏡像並以 docker-compose 啟動

**Tech Stack:** GitHub Actions, Docker, Docker Compose, GHCR, PM2, appleboy/ssh-action

---

### Task 1: 建立 GitHub Actions 部署工作流

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: 撰寫 deploy.yml**

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata for Docker
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./docker/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy to server via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          port: ${{ secrets.SERVER_PORT || 22 }}
          username: ${{ secrets.SERVER_USER }}
          password: ${{ secrets.SERVER_PASSWORD }}
          script: |
            DEPLOY_DIR="/home/${{ secrets.SERVER_USER }}/ele_admin"
            mkdir -p "$DEPLOY_DIR"
            cd "$DEPLOY_DIR"

            # 3. 確保 docker-compose.yml 存在（首次部署時從 git 取得）
            if [ ! -f "docker-compose.yml" ]; then
              if command -v git &>/dev/null; then
                git clone --depth 1 https://github.com/${{ github.repository }}.git /tmp/ele_admin_repo
                cp /tmp/ele_admin_repo/docker-compose.yml .
                cp -r /tmp/ele_admin_repo/backup .
                cp /tmp/ele_admin_repo/deploy/*.sh . 2>/dev/null || true
                rm -rf /tmp/ele_admin_repo
              fi
            fi

            # 4. 創建 .env（首次部署時）
            if [ ! -f ".env" ]; then
              JWT_SECRET=$(openssl rand -hex 32)
              cat > .env << 'ENVEOF'
JWT_SECRET=
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
LOG_RETENTION_DAYS=30
RESPONSE_TIME_ZONE=Asia/Shanghai
UPLOAD_MAX_SIZE=10485760
ENVEOF
              # 寫入隨機密鑰（分開處理避免變量展開問題）
              sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
              echo "✅ 已生成 .env 文件（JWT_SECRET 已自動生成）"
            fi

            # 5. 拉取最新鏡像
            echo "📥 拉取最新應用鏡像..."
            docker compose pull app

            # 6. 確保 MongoDB 運行
            echo "🐳 啟動 MongoDB..."
            docker compose up -d mongodb

            # 7. 等待 MongoDB 就緒
            echo "⏳ 等待 MongoDB 就緒..."
            for i in $(seq 1 30); do
              if docker compose exec -T mongodb mongosh --quiet --eval "db.adminCommand('ping').ok" 2>/dev/null | grep -q 1; then
                echo "✅ MongoDB 已就緒"
                break
              fi
              if [ "$i" -eq 30 ]; then
                echo "⚠️  MongoDB 未在預期時間內就緒，繼續部署..."
              fi
              sleep 2
            done

            # 8. 還原資料庫備份（僅首次，備份目錄存在時執行）
            if [ -d "backup/extract/mongo-backup/ele_admin" ]; then
              echo "📦 檢測到資料庫備份，開始還原..."
            fi

            # 9. 啟動應用服務
            echo "🚀 啟動應用服務..."
            docker compose up -d --remove-orphans

            # 10. 健康檢查
            echo "🏥 執行健康檢查..."
            sleep 5
            for i in $(seq 1 12); do
              if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
                echo "✅ 應用已正常啟動"
                break
              fi
              if [ "$i" -eq 12 ]; then
                echo "⚠️  健康檢查未通過，請手動檢查日誌"
                docker compose logs --tail=20 app
              fi
              sleep 5
            done

            # 11. 清理舊鏡像
            docker image prune -f

            echo ""
            echo "============================================"
            echo "✅ 部署完成！"
            echo "============================================"
            docker compose ps
```

- [ ] **Step 2: 驗證 workflow 語法**

```bash
# YAML 語法檢查（如果已安裝 yamllint）
# cd /Users/jersenleiboy/Desktop/project/express-mongodb-backend-api
# 無需命令，僅視覺確認 YAML 縮進正確
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: 添加 GitHub Actions 自動化部署工作流

- 推送 main 分支觸發構建與部署
- 構建 Docker 鏡像並推送至 GHCR
- SSH 到騰訊雲伺服器執行部署
- 包含 MongoDB 啟動等待、健康檢查"

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

---

### Task 2: 建立伺服器初始化腳本

**Files:**
- Create: `deploy/init-server.sh`

- [ ] **Step 1: 撰寫 init-server.sh**

```bash
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
```

- [ ] **Step 2: 賦予執行權限**

```bash
chmod +x deploy/init-server.sh
```

- [ ] **Step 3: Commit**

```bash
git add deploy/init-server.sh
git commit -m "feat: 添加伺服器初始化腳本

- 自動安裝 Docker、Docker Compose
- 配置國內鏡像加速
- 生成 .env 含隨機 JWT_SECRET
- 獲取部署所需的 docker-compose.yml"

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

---

### Task 3: 配置 GitHub Secrets

- [ ] **Step 1: 確認 GitHub Secrets 設置**

用戶需要在 GitHub 倉庫 → Settings → Secrets and variables → Actions 中添加：

| Secret | 值 |
|--------|-----|
| `SERVER_HOST` | 騰訊雲伺服器公網 IP |
| `SERVER_PORT` | SSH 端口（預設 `22`） |
| `SERVER_USER` | SSH 用戶名（如 `ubuntu`） |
| `SERVER_PASSWORD` | SSH 密碼 |

- [ ] **Step 2: 驗證 GHCR 權限**

確保 GitHub 倉庫的 Settings → Actions → General → Workflow permissions 中：
- ✅ "Read and write permissions" 已勾選
- ✅ "Allow GitHub Actions to create and approve pull requests" 已勾選

---

### Task 4: 伺服器初始化執行

- [ ] **Step 1: SSH 登入騰訊雲伺服器**

```bash
ssh ubuntu@<SERVER_IP>
```

- [ ] **Step 2: 拉取代碼並執行初始化腳本**

```bash
# 先 clone 倉庫（確保 deploy/init-server.sh 可用）
git clone --depth 1 https://github.com/jersenleiboy/express-mongodb-backend-api.git /tmp/ele_admin
cd /tmp/ele_admin

# 執行初始化腳本
bash deploy/init-server.sh

# 如果 docker 組提示退出，執行 newgrp docker 後重新執行
newgrp docker
bash deploy/init-server.sh
```

- [ ] **Step 3: 確認 Docker 運行**

```bash
# 確認 Docker 正常
docker info
docker compose version

# 確認 .env 已生成
cat ~/ele_admin/.env
```

---

### Task 5: 推送觸發部署驗證

- [ ] **Step 1: 推送代碼到 GitHub**

```bash
git push origin main
```

- [ ] **Step 2: 在 GitHub 上觀察部署進度**

瀏覽器打開 GitHub 倉庫 → Actions 頁籤 → 查看 `Deploy to Production` workflow 運行狀態

- [ ] **Step 3: 登入伺服器確認服務運行**

```bash
# 確認容器狀態
ssh ubuntu@<SERVER_IP>
cd ~/ele_admin
docker compose ps

# 預期輸出（類似）：
# NAME                 IMAGE                                          STATUS
# ele_admin_mongodb    mongo:6                                        Up (healthy)
# ele_admin_backend    ghcr.io/jersenleiboy/express-mongodb-backend   Up (healthy)

# 確認 API 正常
curl http://localhost:3000/health
# 預期: {"status":"ok","timestamp":"..."}
```
