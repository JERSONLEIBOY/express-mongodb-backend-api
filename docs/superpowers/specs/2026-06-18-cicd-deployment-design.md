# CI/CD 自動化部署設計

## 概述

透過 GitHub Actions 實現 Express + MongoDB 後端 API 專案自動化部署到騰訊雲伺服器。採用 GHCR (GitHub Container Registry) 儲存 Docker 鏡像，伺服器直接拉取鏡像運行。

## 架構

```
開發者推送 main → GitHub Actions
                       → 1. 構建 Docker 鏡像
                       → 2. 推送至 GHCR
                       → 3. SSH 連接騰訊雲伺服器
                       → 4. 拉取新鏡像 + docker compose up -d
```

- **構建環境**: GitHub Actions (ubuntu-latest)
- **鏡像倉庫**: GitHub Container Registry (ghcr.io)
- **運行環境**: 騰訊雲 Ubuntu 伺服器
- **進程管理**: Docker Compose (app + MongoDB)
- **SSH 認證**: 密碼認證（透過 GitHub Secrets）

## 文件結構

```
.github/workflows/deploy.yml    ← CI/CD 流程（核心）
docker/Dockerfile               ← ✅ 已有（多階段構建，node:18-alpine）
docker-compose.yml              ← ✅ 已有（app + MongoDB 容器編排）
deploy/init-server.sh           ← 🆕 伺服器一次性初始化腳本
```

## 詳細設計

### 1. GitHub Actions 工作流 (deploy.yml)

**觸發條件**: 推送到 `main` 分支

**Stage 1 — 構建與推送（GitHub Runner）**:

| 步驟 | Action | 用途 |
|------|--------|------|
| Checkout | `actions/checkout@v4` | 拉取代碼 |
| Docker Buildx | `docker/setup-buildx-action@v3` | 啟用 BuildKit |
| GHCR 登入 | `docker/login-action@v3` | 使用 GITHUB_TOKEN 登入 |
| 元數據 | `docker/metadata-action@v5` | 生成 tags: `latest`, `main-<sha>` |
| 構建推送 | `docker/build-push-action@v5` | 構建並推送，啟用 GHA 緩存 |

**Stage 2 — 部署（SSH 到騰訊雲）**:

使用 `appleboy/ssh-action@v1.0.3`，執行以下命令：

1. 安裝 Docker & Compose（冪等）
2. `docker compose pull app` — 拉取最新應用鏡像
3. `docker compose up -d mongodb` — 確保 MongoDB 運行
4. 等待 MongoDB 就緒（health check 循環）
5. `docker compose up -d --remove-orphans` — 重啟應用容器
6. `docker image prune -f` — 清理舊鏡像
7. 輸出部署狀態

### 2. 伺服器初始化腳本 (init-server.sh)

首次部署前人工執行一次，完成：

1. 安裝 Docker（`get.docker.com` 官方腳本）
2. 安裝 Docker Compose 插件
3. 配置 Docker daemon mirror（改善國內鏡像拉取速度）
4. 創建部署目錄 `/home/ubuntu/ele_admin`
5. 生成 `.env` 文件（隨機 JWT_SECRET + 可選配置）
6. 創建必要目錄（backup, logs）

**注意**: 初始化腳本執行後可能需要重新登入以使 docker 組生效。

### 3. docker-compose.yml

✅ 已有文件，不需修改。包含兩個服務：

- **mongodb**: mongo:6，數據持久化到 volume
- **app**: 從 GHCR 拉取鏡像，環境變量來自 `.env` 文件

### 4. GitHub Secrets

| Secret | 說明 | 示例 |
|--------|------|------|
| `SERVER_HOST` | 伺服器 IP | `1.2.3.4` |
| `SERVER_PORT` | SSH 端口 | `22` |
| `SERVER_USER` | SSH 用戶 | `ubuntu` |
| `SERVER_PASSWORD` | SSH 密碼 | `****` |

### 5. 鏡像優化

- 使用多階段構建（deps + run 兩階段）
- 基礎鏡像 `node:18-alpine` 體積小
- 啟用 GitHub Actions 緩存 (`cache-from: type=gha, cache-to: type=gha,mode=max`)
- 伺服器端定期清理舊鏡像 (`docker image prune -f`)

### 6. 回滾方案

若有問題需要回滾：

```bash
# SSH 到伺服器，指定舊版本鏡像 tag
docker compose stop app
docker compose rm app
sed -i 's|:latest|:main-<old-sha>|' docker-compose.yml
docker compose up -d app
```

## 安全考量

- JWT_SECRET 在伺服器初始化時隨機生成，存入 `.env`
- SSH 憑證存儲在 GitHub Secrets，不會暴露在代碼中
- 應用容器以非 root 用戶（node）運行
- MongoDB 不暴露外部端口，僅內部 network 訪問
- Docker 鏡像只包含運行時依賴，不包含源碼中的敏感文件（.env 等）

## 邊界情況

- **首次部署**: 初始化腳本負責安裝 Docker 及配置
- **MongoDB 首次啟動**: 自動創建資料庫，等待 health check 通過
- **部署失敗**: GitHub Actions 會顯示錯誤，伺服器保持舊版本運行
- **Docker 未安裝**: init-server.sh 中的冪等安裝邏輯處理
