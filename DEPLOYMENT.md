# 自动化部署文档

## 概述

本项目使用 **GitHub Actions + Docker + GitHub Container Registry** 实现自动化部署到腾讯云服务器。

## 部署架构

```
代码推送到 main 分支
    ↓
GitHub Actions 自动触发
    ↓
构建 Docker 镜像
    ↓
推送到 ghcr.io
    ↓
SSH 连接服务器
    ↓
拉取最新镜像
    ↓
备份数据库
    ↓
docker-compose 更新
    ↓
健康检查
    ↓
部署完成
```

## 一、服务器初始化（首次部署）

### 1.1 准备工作

确保腾讯云服务器已安装：
- Docker 26
- Docker Compose
- SSH 访问权限

### 1.2 上传初始化脚本到服务器

```bash
# 在本地执行
scp scripts/server-setup.sh root@你的服务器IP:/tmp/
```

### 1.3 在服务器上执行初始化

```bash
# SSH 登录到服务器
ssh root@你的服务器IP

# 执行初始化脚本（替换为你的 GitHub 仓库名）
chmod +x /tmp/server-setup.sh
/tmp/server-setup.sh your-github-username/express-mongodb-backend-api

# 编辑环境变量配置
cd /opt/express-mongodb-backend-api
nano .env
```

### 1.4 修改 .env 配置

```bash
# 修改以下配置项
GITHUB_REPOSITORY=你的GitHub用户名/express-mongodb-backend-api
JWT_SECRET=修改为强随机密钥
CORS_ORIGIN=https://your-domain.com  # 生产环境设置为实际域名
```

## 二、配置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

1. 进入仓库页面：`Settings` → `Secrets and variables` → `Actions`
2. 点击 `New repository secret`，添加以下配置：

| Secret 名称 | 说明 | 示例 |
|------------|------|------|
| `SERVER_HOST` | 服务器 IP 地址 | `123.45.67.89` |
| `SERVER_USER` | SSH 用户名 | `root` 或 `ubuntu` |
| `SERVER_SSH_KEY` | SSH 私钥 | 完整的私钥内容 |
| `SERVER_PORT` | SSH 端口 | `22`（默认） |

### 2.1 获取 SSH 私钥

```bash
# 在本地生成 SSH 密钥（如果还没有）
ssh-keygen -t rsa -b 4096 -C "deploy@github-actions"

# 查看私钥内容（复制全部内容到 SERVER_SSH_KEY）
cat ~/.ssh/id_rsa

# 将公钥添加到服务器
ssh-copy-id -i ~/.ssh/id_rsa.pub root@你的服务器IP
```

## 三、自动部署流程

### 3.1 触发部署

推送代码到 `main` 分支即可自动触发部署：

```bash
git add .
git commit -m "feat: 新功能"
git push origin main
```

### 3.2 监控部署进度

1. 进入 GitHub 仓库页面
2. 点击 `Actions` 标签页
3. 查看最新的工作流运行状态

### 3.3 部署步骤说明

GitHub Actions 会自动执行以下步骤：

1. ✅ 检出代码
2. ✅ 构建 Docker 镜像
3. ✅ 推送镜像到 ghcr.io
4. ✅ SSH 连接服务器
5. ✅ 备份数据库
6. ✅ 拉取最新镜像
7. ✅ 停止旧容器
8. ✅ 启动新容器
9. ✅ 健康检查
10. ✅ 清理旧镜像

## 四、服务器管理命令

### 4.1 查看服务状态

```bash
cd /opt/express-mongodb-backend-api

# 查看容器状态
docker-compose ps

# 查看应用日志
docker-compose logs -f app

# 查看 MongoDB 日志
docker-compose logs -f mongodb
```

### 4.2 手动部署

```bash
cd /opt/express-mongodb-backend-api

# 拉取最新镜像
docker-compose pull

# 重启服务
docker-compose up -d

# 查看健康状态
curl http://localhost:3000/health
```

### 4.3 数据库管理

```bash
cd /opt/express-mongodb-backend-api

# 手动备份数据库
./scripts/backup-db.sh

# 查看备份列表
ls -lh backup/

# 恢复数据库（谨慎操作）
./scripts/restore-db.sh backup/mongodb_backup_20260618_120000.tar.gz

# 进入 MongoDB 容器
docker exec -it ele_admin_mongodb mongosh ele_admin
```

### 4.4 应用管理

```bash
# 重启应用
docker-compose restart app

# 停止所有服务
docker-compose down

# 启动所有服务
docker-compose up -d

# 查看资源占用
docker stats

# 清理无用镜像
docker image prune -a
```

## 五、健康检查

### 5.1 应用健康检查

```bash
# 检查应用是否正常运行
curl http://localhost:3000/health

# 预期返回
{
  "status": "ok",
  "timestamp": "2026-06-18 12:00:00"
}
```

### 5.2 Swagger API 文档

访问：`http://你的服务器IP:3000/api-docs`

## 六、初始化应用数据

首次部署后，需要初始化基础数据：

```bash
# 进入应用容器
docker exec -it ele_admin_backend sh

# 执行初始化脚本
npm run init-data

# 退出容器
exit
```

初始化后会创建默认账户：
- 管理员：`admin / admin123`
- 普通用户：`testuser / test123`
- 访客：`guestuser / guest123`

## 七、常见问题排查

### 7.1 部署失败

**问题：GitHub Actions 部署失败**

排查步骤：
1. 检查 GitHub Secrets 配置是否正确
2. 检查服务器 SSH 连接是否正常
3. 查看 Actions 日志中的错误信息

### 7.2 容器启动失败

**问题：容器启动后立即退出**

```bash
# 查看容器日志
docker-compose logs app

# 常见原因：
# 1. 环境变量配置错误
# 2. MongoDB 未就绪
# 3. 端口被占用
```

### 7.3 数据库连接失败

**问题：应用无法连接 MongoDB**

```bash
# 检查 MongoDB 是否运行
docker-compose ps mongodb

# 测试 MongoDB 连接
docker exec ele_admin_mongodb mongosh --eval "db.adminCommand('ping')"

# 检查网络
docker network ls
docker network inspect express-mongodb-backend-api_ele_admin_network
```

### 7.4 镜像拉取失败

**问题：服务器拉取 ghcr.io 镜像慢或失败**

```bash
# 方案 1：配置镜像加速（如果需要）
# 编辑 /etc/docker/daemon.json

# 方案 2：手动拉取
docker pull ghcr.io/你的用户名/express-mongodb-backend-api:latest

# 方案 3：检查 GitHub Token 权限
# 确保 GITHUB_TOKEN 有读取 packages 的权限
```

## 八、性能优化建议

### 8.1 Nginx 反向代理（推荐）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 8.2 HTTPS 配置（推荐）

使用 Certbot 配置免费 SSL 证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 自动配置 HTTPS
sudo certbot --nginx -d your-domain.com
```

### 8.3 PM2 集群模式

修改 `pm2.config.js`：

```javascript
instances: 'max',  // 使用所有 CPU 核心
exec_mode: 'cluster',
```

## 九、安全建议

1. **修改默认密码**：首次登录后立即修改 admin 密码
2. **配置防火墙**：只开放必要端口（22, 80, 443）
3. **定期备份**：检查每日自动备份是否正常
4. **监控日志**：定期查看应用和系统日志
5. **更新依赖**：定期更新 npm 包和系统软件

## 十、回滚方案

如果新版本出现问题，可以快速回滚：

```bash
# 方案 1：使用之前的镜像 tag
docker-compose down
docker pull ghcr.io/你的用户名/express-mongodb-backend-api:main-abc1234
# 修改 docker-compose.yml 中的镜像 tag
docker-compose up -d

# 方案 2：恢复数据库备份
./scripts/restore-db.sh backup/mongodb_backup_旧版本时间.tar.gz

# 方案 3：回滚 Git 版本后重新部署
git revert HEAD
git push origin main  # 自动触发部署
```

## 附录：目录结构

```
/opt/express-mongodb-backend-api/
├── .env                    # 环境变量配置
├── docker-compose.yml      # Docker Compose 配置
├── backup/                 # 数据库备份目录
│   └── mongodb_backup_*.tar.gz
├── scripts/               # 运维脚本
│   ├── backup-db.sh       # 数据库备份
│   └── restore-db.sh      # 数据库恢复
└── logs/                  # 日志目录
    └── backup.log         # 备份日志
```

## 支持

如有问题，请查看：
1. GitHub Actions 日志
2. 服务器应用日志：`docker-compose logs -f app`
3. 项目 Issues：提交问题到 GitHub 仓库
