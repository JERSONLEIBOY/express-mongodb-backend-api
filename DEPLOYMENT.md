# 自动化部署文档

## 部署架构

```
开发者 git push (main)
    → GitHub Actions 触发
        → 构建 Docker 镜像（使用 Git SHA 作为版本标签）
        → 推送镜像到 GHCR
        → SSH 连接腾讯云服务器
        → 记录当前版本（用于回滚）
        → 拉取新镜像，重启服务
        → 健康检查验证
```

## 首次部署

### 1. 服务器初始化

SSH 登录腾讯云服务器，执行初始化脚本：

```bash
ssh root@<服务器IP>

# 下载并执行初始化脚本
curl -fsSL https://raw.githubusercontent.com/JERSONLEIBOY/express-mongodb-backend-api/main/scripts/init-server.sh -o init-server.sh
chmod +x init-server.sh
./init-server.sh
```

脚本自动完成：
- Docker 和 Docker Compose 环境检查
- GHCR 镜像仓库登录（如需要）
- 创建部署目录 `/opt/ele_admin`
- 下载 `docker-compose.yml`
- 生成生产环境 `.env`（JWT_SECRET 自动生成）

### 2. 配置 GitHub Secrets

在 GitHub 仓库 → Settings → Secrets and variables → Actions 添加：

| Secret 名称 | 值 | 说明 |
|-------------|------|------|
| `SERVER_HOST` | 服务器公网 IP | 如 `123.207.xx.xx` |
| `SERVER_USER` | SSH 用户名 | 如 `root` 或 `ubuntu` |
| `SERVER_PORT` | `22` | SSH 端口（默认 22） |
| `SERVER_SSH_KEY` | SSH 私钥 | 用于自动登录服务器 |

**生成 SSH 密钥对（如已有可跳过）：**

```bash
# 在本地 Mac/Linux 执行
ssh-keygen -t ed25519 -C "deploy" -f deploy_key -N ""
cat deploy_key        # 私钥 → 复制到 SERVER_SSH_KEY
cat deploy_key.pub    # 公钥 → 添加到服务器 ~/.ssh/authorized_keys
```

### 3. 启用自动部署

推送代码到 main 分支即可触发自动部署：

```bash
git push origin main
```

## 服务器运维

### 服务管理

```bash
# SSH 登录
ssh root@<服务器IP>

# 进入部署目录
cd /opt/ele_admin

# 查看服务状态
docker compose ps

# 查看实时日志
docker compose logs -f

# 查看应用日志
docker compose logs app -f

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 启动服务
docker compose up -d
```

### 数据库备份

```bash
cd /opt/ele_admin

# 手动备份（默认保留 7 天）
./scripts/backup.sh

# 指定保留天数
./scripts/backup.sh 30

# 查看备份文件
ls -lh backup/
```

**定时自动备份（可选）：**

```bash
crontab -e

# 添加定时任务：每天凌晨 2 点执行备份
0 2 * * * /opt/ele_admin/scripts/backup.sh 7 >> /opt/ele_admin/logs/backup.log 2>&1
```

### 数据库恢复

```bash
# 查看可用备份
ls -lh /opt/ele_admin/backup/*.tar.gz

# 从备份恢复
./scripts/restore.sh /opt/ele_admin/backup/ele_admin_20260618_120000.tar.gz

# 重启应用
docker compose restart app
```

### 回滚

```bash
cd /opt/ele_admin

# 回滚到上一个版本
./scripts/rollback.sh

# 回滚到指定版本
./scripts/rollback.sh sha-abc1234
```

## 环境变量

生产环境 `.env` 位于 `/opt/ele_admin/.env`：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NODE_ENV` | production | 运行环境 |
| `PORT` | 3000 | 服务端口 |
| `MONGODB_URI` | mongodb://mongodb:27017/ele_admin | MongoDB 连接字符串 |
| `JWT_SECRET` | 自动生成 | JWT 密钥 |
| `JWT_EXPIRES_IN` | 7d | Token 过期时间 |
| `CORS_ORIGIN` | * | CORS 白名单 |
| `LOG_RETENTION_DAYS` | 30 | 日志保留天数 |
| `RESPONSE_TIME_ZONE` | Asia/Shanghai | 时区 |
| `UPLOAD_MAX_SIZE` | 10485760 | 上传文件大小限制 |

修改环境变量后需要重启服务：

```bash
cd /opt/ele_admin
docker compose down
docker compose up -d
```

## 常见问题

### 部署失败：健康检查超时

```bash
cd /opt/ele_admin
docker compose logs app --tail=100
```

常见原因：
- MongoDB 未完全启动（等待 30 秒后重试）
- 环境变量配置错误
- 端口被占用

### 镜像拉取失败

```bash
# 检查镜像是否存在
docker images | grep express

# 重新登录 GHCR（如需要）
docker login ghcr.io -u <GitHub用户名>
```

### 数据库连接失败

```bash
# 检查 MongoDB 容器状态
docker compose ps mongodb

# 检查 MongoDB 日志
docker compose logs mongodb --tail=50
```

### SSH 连接失败

```bash
# 检查 SSH 密钥是否正确配置
# 公钥应添加到服务器 ~/.ssh/authorized_keys
# 私钥应配置在 GitHub Secrets SERVER_SSH_KEY 中
```

## 部署流程详解

### GitHub Actions 工作流

1. **构建阶段**
   - 检出代码
   - 构建 Docker 镜像（多阶段构建）
   - 推送镜像到 GHCR（使用 SHA 作为标签）

2. **部署阶段**
   - SSH 连接服务器
   - 记录当前版本
   - 停止旧服务
   - 拉取新镜像
   - 启动服务
   - 健康检查（12 次重试，每次 5 秒）

3. **回滚机制**
   - 构建失败时自动触发回滚
   - 使用版本记录支持手动回滚
   - 版本文件：`/opt/ele_admin/.versions`

## 安全建议

1. **SSH 密钥**：使用专用部署密钥，不要使用具有 sudo 权限的密钥
2. **CORS_ORIGIN**：生产环境建议设置为具体域名
3. **JWT_SECRET**：定期更换
4. **防火墙**：只开放必要端口（22, 3000）
