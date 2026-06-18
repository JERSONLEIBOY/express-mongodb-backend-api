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
0 2 * * * /opt/ele_admin/scripts/backup-db.sh 7 >> /opt/ele_admin/logs/backup.log 2>&1
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
