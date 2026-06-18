# 🚀 自动化部署快速开始指南

## 5 分钟完成自动化部署配置

### 第一步：本地准备（2 分钟）

1. **生成 SSH 密钥**（如果还没有）
```bash
ssh-keygen -t rsa -b 4096 -C "deploy@github-actions"
```

2. **查看私钥内容**（稍后需要复制到 GitHub Secrets）
```bash
cat ~/.ssh/id_rsa
```

3. **复制公钥到服务器**
```bash
ssh-copy-id root@你的服务器IP
```

### 第二步：服务器初始化（3 分钟）

**方式 1：自动初始化（推荐）**

```bash
# 上传脚本到服务器
scp scripts/server-setup.sh root@你的服务器IP:/tmp/

# SSH 登录服务器
ssh root@你的服务器IP

# 执行初始化（替换为你的 GitHub 仓库名）
chmod +x /tmp/server-setup.sh
/tmp/server-setup.sh 你的GitHub用户名/express-mongodb-backend-api

# 编辑环境变量
cd /opt/express-mongodb-backend-api
nano .env
```

**需要修改的配置：**
```bash
GITHUB_REPOSITORY=你的GitHub用户名/express-mongodb-backend-api
JWT_SECRET=你的强随机密钥（建议用 openssl rand -base64 32 生成）
CORS_ORIGIN=https://你的域名.com
```

**方式 2：手动初始化**

```bash
# SSH 登录服务器
ssh root@你的服务器IP

# 创建目录
sudo mkdir -p /opt/express-mongodb-backend-api/{backup,scripts,logs}
sudo chown -R $USER:$USER /opt/express-mongodb-backend-api
cd /opt/express-mongodb-backend-api

# 下载配置文件
curl -o docker-compose.yml https://raw.githubusercontent.com/你的用户名/express-mongodb-backend-api/main/docker-compose.yml
curl -o scripts/backup-db.sh https://raw.githubusercontent.com/你的用户名/express-mongodb-backend-api/main/scripts/backup-db.sh
curl -o scripts/restore-db.sh https://raw.githubusercontent.com/你的用户名/express-mongodb-backend-api/main/scripts/restore-db.sh
chmod +x scripts/*.sh

# 创建 .env 文件（复制 .env.production.example 内容并修改）
nano .env
```

### 第三步：配置 GitHub Secrets（1 分钟）

1. 打开 GitHub 仓库页面
2. 进入：`Settings` → `Secrets and variables` → `Actions`
3. 点击 `New repository secret`，添加以下 4 个：

| Secret 名称 | 值 |
|------------|---|
| `SERVER_HOST` | 你的服务器 IP（如 `123.45.67.89`）|
| `SERVER_USER` | SSH 用户名（通常是 `root` 或 `ubuntu`）|
| `SERVER_SSH_KEY` | 私钥完整内容（`cat ~/.ssh/id_rsa` 的输出）|
| `SERVER_PORT` | SSH 端口（默认 `22`）|

### 第四步：首次部署

```bash
# 本地推送代码
git add .
git commit -m "feat: 配置自动化部署"
git push origin main
```

然后：
1. 打开 GitHub 仓库的 `Actions` 标签页
2. 查看部署进度
3. 等待部署完成（约 3-5 分钟）

### 第五步：初始化数据

```bash
# SSH 登录服务器
ssh root@你的服务器IP

# 进入容器执行初始化
docker exec -it ele_admin_backend npm run init-data
```

### 第六步：验证部署

```bash
# 测试健康检查
curl http://你的服务器IP:3000/health

# 访问 API 文档
open http://你的服务器IP:3000/api-docs
```

**默认账号：**
- 管理员：`admin / admin123`
- 普通用户：`testuser / test123`

⚠️ **记得立即修改默认密码！**

## 日常使用

### 自动部署
```bash
# 每次推送到 main 分支都会自动部署
git push origin main
```

### 查看日志
```bash
ssh root@你的服务器IP
cd /opt/express-mongodb-backend-api
docker-compose logs -f app
```

### 手动备份
```bash
ssh root@你的服务器IP
/opt/express-mongodb-backend-api/scripts/backup-db.sh
```

## 故障排查

### 部署失败？
1. 检查 GitHub Actions 日志
2. 检查 GitHub Secrets 是否配置正确
3. 测试 SSH 连接：`ssh -i ~/.ssh/id_rsa root@你的服务器IP`

### 容器启动失败？
```bash
# 查看容器日志
docker-compose logs app

# 检查环境变量
cat .env
```

### 无法访问？
```bash
# 检查容器状态
docker-compose ps

# 检查端口
netstat -tlnp | grep 3000

# 检查防火墙
sudo ufw status
```

## 下一步

- 📖 查看完整部署文档：[DEPLOYMENT.md](./DEPLOYMENT.md)
- 🔒 配置 Nginx 和 HTTPS
- 📊 配置监控和告警
- 🔄 设置备份计划

## 需要帮助？

- 完整文档：[DEPLOYMENT.md](./DEPLOYMENT.md)
- 提交 Issue：GitHub Issues
- 查看示例：项目 Wiki
