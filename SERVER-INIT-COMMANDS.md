# 服务器初始化命令（待执行）

## 📋 前提条件

- ✅ GitHub Secrets 已配置
- ✅ SSH 公钥已添加到服务器
- ✅ 服务器已安装 Docker 和 Docker Compose

---

## 🖥️ 方式 1：自动初始化（推荐）

### 步骤 1：上传初始化脚本

```bash
# 在本地执行（替换为你的服务器 IP）
scp scripts/server-setup.sh root@你的服务器IP:/tmp/
```

### 步骤 2：SSH 登录服务器

```bash
ssh root@你的服务器IP
```

### 步骤 3：执行初始化脚本

```bash
# 在服务器上执行（替换为你的 GitHub 用户名）
chmod +x /tmp/server-setup.sh
/tmp/server-setup.sh JERSONLEIBOY/express-mongodb-backend-api
```

### 步骤 4：配置环境变量

```bash
cd /opt/express-mongodb-backend-api
nano .env
```

修改以下配置：

```bash
GITHUB_REPOSITORY=JERSONLEIBOY/express-mongodb-backend-api
JWT_SECRET=你的强随机密钥
CORS_ORIGIN=https://你的域名.com
```

---

## 🖥️ 方式 2：手动初始化

如果自动脚本失败，可以手动执行：

### 步骤 1：创建目录结构

```bash
ssh root@你的服务器IP

sudo mkdir -p /opt/express-mongodb-backend-api/{backup,scripts,logs}
sudo chown -R $USER:$USER /opt/express-mongodb-backend-api
cd /opt/express-mongodb-backend-api
```

### 步骤 2：安装 Docker Compose（如果需要）

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

### 步骤 3：下载配置文件

```bash
# 下载 docker-compose.yml
curl -o docker-compose.yml https://raw.githubusercontent.com/JERSONLEIBOY/express-mongodb-backend-api/main/docker-compose.yml

# 下载脚本
curl -o scripts/backup-db.sh https://raw.githubusercontent.com/JERSONLEIBOY/express-mongodb-backend-api/main/scripts/backup-db.sh
curl -o scripts/restore-db.sh https://raw.githubusercontent.com/JERSONLEIBOY/express-mongodb-backend-api/main/scripts/restore-db.sh
chmod +x scripts/*.sh
```

### 步骤 4：创建 .env 文件

```bash
cat > .env << 'ENVEOF'
GITHUB_REPOSITORY=JERSONLEIBOY/express-mongodb-backend-api
JWT_SECRET=生成的强随机密钥
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
LOG_RETENTION_DAYS=30
RESPONSE_TIME_ZONE=Asia/Shanghai
UPLOAD_MAX_SIZE=10485760
ENVEOF
```

### 步骤 5：生成强随机 JWT 密钥

```bash
# 生成密钥
openssl rand -base64 32

# 替换 .env 中的 JWT_SECRET
nano .env
```

### 步骤 6：配置定时备份

```bash
# 添加 cron 任务（每天凌晨 2 点备份）
(crontab -l 2>/dev/null | grep -v backup-db.sh; echo "0 2 * * * /opt/express-mongodb-backend-api/scripts/backup-db.sh >> /opt/express-mongodb-backend-api/logs/backup.log 2>&1") | crontab -

# 验证 cron 任务
crontab -l
```

---

## ✅ 验证初始化是否成功

### 检查目录结构

```bash
ls -la /opt/express-mongodb-backend-api/
```

应该看到：

```
drwxr-xr-x  backup/
drwxr-xr-x  scripts/
drwxr-xr-x  logs/
-rw-r--r--  .env
-rw-r--r--  docker-compose.yml
```

### 检查环境变量

```bash
cat /opt/express-mongodb-backend-api/.env
```

确认：

- GITHUB_REPOSITORY 正确
- JWT_SECRET 不是默认值
- 其他配置符合要求

### 检查脚本权限

```bash
ls -la /opt/express-mongodb-backend-api/scripts/
```

应该看到 `rwxr-xr-x`（可执行）

---

## 🚀 初始化完成后

告诉我：**"服务器已初始化"**

我会帮你：

1. 触发首次自动部署
2. 初始化数据库
3. 验证部署结果
