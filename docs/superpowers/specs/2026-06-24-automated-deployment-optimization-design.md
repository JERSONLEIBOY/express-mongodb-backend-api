# 自动化部署优化设计方案

**日期：** 2026-06-24  
**项目：** Express MongoDB Backend API  
**目标：** 优化自动化部署流程，解决 GitHub CI 慢的问题，实现快速部署和回滚

## 1. 背景与问题

### 当前状况
- 部署方式：GitHub Actions → SCP 传代码到服务器 → 服务器本地构建 Docker 镜像 → docker-compose 部署
- 服务器：腾讯云，IP 118.25.40.64，刚重置（Ubuntu Server 22.04 LTS with Docker）
- 主要问题：**GitHub CI 非常慢**（预估 5-10 分钟）

### 问题根因分析
1. **网络延迟** - GitHub Actions 服务器在国外，与国内腾讯云服务器传输慢
2. **依赖下载慢** - npm 依赖从国外源下载，Docker 基础镜像拉取慢
3. **缺少缓存** - 每次完整构建，没有利用构建缓存
4. **版本管理缺失** - 没有版本化镜像，无法快速回滚

### 需求确认
- **部署频率：** 高频（每天多次），需要快速回滚能力
- **备份需求：** 每周自动备份，保留 4 周
- **环境：** 单生产环境（无测试环境）
- **监控：** 基础监控即可，不需要复杂告警系统

## 2. 方案选择

### 方案对比

**方案 A：优化的服务器本地构建（采用）**
- 保持当前架构，通过配置国内镜像源、优化构建缓存、版本管理来加速
- 优点：适合国内网络、架构简单、成本低、回滚快
- 缺点：服务器需要构建资源

**方案 B：国内镜像仓库 + CI 构建**
- 使用腾讯云 TCR，GitHub Actions 构建推送，服务器拉取
- 优点：构建部署分离、便于扩展
- 缺点：GitHub Actions 构建仍慢、增加外部依赖

**方案 C：Webhook + 服务器自动构建**
- 服务器监听 GitHub Webhook，自动 git pull + 构建
- 优点：完全绕过 GitHub Actions，最快
- 缺点：需要暴露端口、缺少 CI 环节

**最终选择：方案 A** - 在现有架构基础上优化，改动最小，效果最明显

## 3. 架构设计

### 3.1 部署流程

```
代码推送到 main 分支
    ↓
GitHub Actions 触发
    ↓
SCP 传输代码到服务器（排除 .git、node_modules）
    ↓
生成 .env 文件（从 GitHub Secrets 注入）
    ↓
服务器本地构建 Docker 镜像
  - 标签：ele_admin_backend:latest
  - 标签：ele_admin_backend:commit-<SHA>
  - 使用国内镜像源加速
    ↓
Docker Compose 部署
  - 停止旧容器
  - 启动新容器
    ↓
健康检查（轮询 /health，最多 60 秒）
    ↓
清理旧镜像（保留最近 3 个版本）
    ↓
部署完成
```

### 3.2 目录结构

```
/opt/ele_admin/
├── repo/                    # 代码仓库（SCP 传输目标）
│   ├── docker/
│   ├── src/
│   ├── docker-compose.yml
│   └── .env                 # CI 自动生成
├── backups/                 # 数据库备份
│   └── backup-YYYY-MM-DD-HHMMSS.gz
└── scripts/                 # 可选：本地脚本
```

### 3.3 版本管理策略

**镜像标签规则：**
- `ele_admin_backend:latest` - 始终指向最新版本
- `ele_admin_backend:commit-<SHA>` - 具体版本（如 `commit-abc1234`）

**版本保留策略：**
- 保留最近 3 个版本的镜像
- 自动清理超过 3 个版本的旧镜像
- 释放磁盘空间，避免占用过多

**回滚机制：**
- 通过 `docker-compose.yml` 中的 `IMAGE_TAG` 环境变量切换版本
- 回滚脚本列出可用版本，选择后自动切换并重启
- 回滚时间：10-15 秒

## 4. 关键优化点

### 4.1 Docker 镜像源加速

**配置腾讯云 Docker 镜像加速器：**
```json
{
  "registry-mirrors": ["https://mirror.ccs.tencentyun.com"]
}
```

**效果：** 拉取 `node:18-alpine` 等基础镜像从分钟级降到秒级

### 4.2 npm 依赖加速

**在 Dockerfile 中配置淘宝镜像源：**
```dockerfile
RUN npm config set registry https://registry.npmmirror.com
RUN npm ci --only=production
```

**效果：** npm 依赖安装从几分钟降到几十秒

### 4.3 Docker 构建优化

**多阶段构建：**
- 阶段 1：安装依赖（缓存层）
- 阶段 2：复制代码和运行时

**层缓存优化：**
```dockerfile
# 先复制 package.json（变化频率低）
COPY package*.json ./
RUN npm ci --only=production

# 后复制代码（变化频率高）
COPY src/ ./src/
```

**启用 BuildKit：**
- 并行构建层
- 更智能的缓存策略
- 构建速度提升 30-50%

**预期构建时间：**
- 首次构建：2-3 分钟
- 增量构建（仅代码变化）：30-60 秒

### 4.4 健康检查改进

**CI 阶段健康检查：**
```bash
for i in $(seq 1 30); do
  if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ 部署成功"
    exit 0
  fi
  echo "等待中... ($i/30)"
  sleep 2
done
```

**容器健康检查：**
- 检查间隔：30 秒
- 超时时间：10 秒
- 失败重试：3 次
- 启动宽限期：40 秒

## 5. 数据备份与恢复

### 5.1 自动备份

**备份策略：**
- 时间：每周日凌晨 2:00
- 方式：cron 定时任务
- 内容：MongoDB 完整数据（`mongodump`）
- 保留：最近 4 周（约 1 个月）

**Crontab 配置：**
```cron
0 2 * * 0 /opt/ele_admin/repo/scripts/backup-db.sh
```

**备份文件命名：**
```
backup-2026-06-24-020000.gz
```

### 5.2 手动备份与恢复

**备份脚本：**
```bash
./scripts/backup-db.sh
```

**恢复脚本：**
```bash
./scripts/restore-db.sh /opt/ele_admin/backups/backup-2026-06-24-020000.gz
```

**回滚前自动备份：**
- 执行回滚前自动创建当前数据库备份
- 确保回滚失败时可以恢复

## 6. 监控与日志

### 6.1 基础监控（零成本）

**Docker 健康检查：**
- 内置在 `docker-compose.yml`
- 检查 `/health` 端点
- 不健康容器自动重启

**Watchtower 容器监控：**
```yaml
watchtower:
  image: containrrr/watchtower
  restart: unless-stopped
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
  command: --interval 300 --cleanup
```
- 每 5 分钟检查容器状态
- 自动重启异常容器
- 清理无用镜像

**部署后验证：**
- GitHub Actions 执行健康检查
- 失败则输出容器日志并标记 CI 失败

### 6.2 日志管理

**应用日志：**
- Winston 日志保留 30 天（现有配置）
- 路径：`/app/src/uploads/logs/`（容器内）
- 通过 volume 持久化

**Docker 容器日志：**
```yaml
logging:
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"
```
- 单文件最大 10MB
- 保留 3 个文件
- 防止日志占满磁盘

**日志查看命令：**
```bash
docker-compose logs -f app          # 实时查看
docker-compose logs --tail 100 app  # 查看最近 100 行
```

### 6.3 告警通知（可选扩展）

当前不实现复杂告警系统。如需扩展：
- 集成 Watchtower + ntfy.sh（免费推送服务）
- 容器异常时推送通知到手机
- 成本：零，配置简单

## 7. 安全设计

### 7.1 网络安全

**端口策略：**
- MongoDB：`127.0.0.1:27017`（仅本地访问）
- 应用：`0.0.0.0:3000`（对外开放）
- SSH：22 端口（仅允许密钥认证）

**防火墙规则：**
```bash
ufw allow 22/tcp    # SSH
ufw allow 3000/tcp  # 应用
ufw enable
```

### 7.2 密钥管理

**GitHub Secrets 配置：**
```
SERVER_HOST        # 118.25.40.64
SERVER_USER        # ubuntu
SERVER_SSH_KEY     # SSH 私钥（完整内容）
SERVER_PORT        # 22
JWT_SECRET         # JWT 密钥
CORS_ORIGIN        # 跨域源
MONGO_USERNAME     # MongoDB 用户名
MONGO_PASSWORD     # MongoDB 密码
```

**服务器 .env 文件：**
- 权限：600（仅 owner 可读写）
- 由 GitHub Actions 自动生成
- 不提交到 Git

**MongoDB 认证：**
- 强制用户名/密码认证
- 配置在 docker-compose.yml 中
- 从环境变量读取

### 7.3 部署安全

**SSH 安全：**
- 禁用密码登录（仅密钥认证）
- GitHub Actions 使用 `appleboy/ssh-action` 安全传输

**敏感信息保护：**
- GitHub Actions 环境变量不打印到日志
- 服务器 .env 文件不可外部访问
- 定期轮换 JWT_SECRET 和数据库密码

## 8. 实施计划

### 阶段 1：服务器初始化（预计 10 分钟）

1. 更新服务器初始化脚本 `scripts/init-server.sh`
   - 验证 Docker 和 Docker Compose 安装
   - 配置腾讯云 Docker 镜像加速器
   - 创建目录结构（/opt/ele_admin/repo、/opt/ele_admin/backups）
   - 配置防火墙规则

2. 在服务器上执行初始化脚本
   ```bash
   ssh ubuntu@118.25.40.64
   bash /path/to/init-server.sh
   ```

3. 配置 GitHub Secrets
   - 在 GitHub 仓库 Settings → Secrets and variables → Actions
   - 添加所有必需的 secrets

### 阶段 2：优化构建配置（预计 20 分钟）

1. 优化 Dockerfile
   - 改为多阶段构建
   - 添加 npm 镜像源配置
   - 优化层缓存顺序

2. 更新 GitHub Actions workflow
   - 添加镜像版本标签逻辑
   - 改进健康检查
   - 添加镜像清理步骤

3. 更新 docker-compose.yml
   - 支持 IMAGE_TAG 环境变量
   - 添加 Watchtower 服务
   - 配置日志轮转

### 阶段 3：部署脚本和工具（预计 20 分钟）

1. 创建回滚脚本 `scripts/rollback.sh`
   - 列出可用版本
   - 交互式选择版本
   - 自动切换并重启

2. 更新备份脚本 `scripts/backup-db.sh`
   - 支持自动和手动备份
   - 添加备份压缩和清理逻辑

3. 创建恢复脚本 `scripts/restore-db.sh`
   - 从备份文件恢复数据库
   - 验证备份文件完整性

4. 配置定时备份任务
   - 添加 crontab 配置
   - 测试备份任务执行

### 阶段 4：监控和日志（预计 10 分钟）

1. 配置 Watchtower
   - 添加到 docker-compose.yml
   - 配置监控间隔和清理策略

2. 配置日志轮转
   - Docker 容器日志配置
   - 验证日志文件大小限制

3. 优化健康检查
   - 调整检查间隔和超时
   - 验证异常重启机制

### 阶段 5：测试验证（预计 20 分钟）

1. 执行首次自动部署
   - 推送代码到 main 分支
   - 观察 GitHub Actions 执行
   - 验证部署成功和健康检查通过

2. 测试回滚流程
   - 列出可用版本
   - 回滚到上一个版本
   - 验证服务恢复正常

3. 测试备份恢复
   - 执行手动备份
   - 模拟数据丢失
   - 从备份恢复并验证

4. 性能验证
   - 记录部署时间（预期 1-2 分钟）
   - 记录回滚时间（预期 10-15 秒）
   - 记录构建时间（首次 2-3 分钟，增量 30-60 秒）

## 9. 预期效果

### 性能提升

| 指标 | 当前 | 优化后 | 提升 |
|------|------|--------|------|
| 部署总时间 | 5-10 分钟 | 1-2 分钟 | **70-80%** |
| 增量构建时间 | 5-10 分钟 | 30-60 秒 | **90%** |
| 回滚时间 | N/A（需要重新部署） | 10-15 秒 | **极大提升** |
| Docker 镜像拉取 | 2-3 分钟 | 5-10 秒 | **95%** |
| npm 依赖安装 | 3-5 分钟 | 30-40 秒 | **85%** |

### 功能完善

✅ **版本管理** - 保留 3 个历史版本，支持快速回滚  
✅ **自动备份** - 每周自动备份，保留 4 周  
✅ **基础监控** - Watchtower 自动重启异常容器  
✅ **日志管理** - 自动轮转，防止磁盘占满  
✅ **安全加固** - 网络隔离、密钥管理、强制认证  

### 运维改善

- **高频部署支持** - 每天多次部署不再是负担
- **快速问题修复** - 发现问题可立即回滚
- **零停机部署** - 健康检查确保新版本正常后才切换
- **数据安全** - 自动备份 + 回滚前备份双重保障

## 10. 风险与应对

### 风险 1：服务器资源不足

**风险描述：** 服务器 CPU/内存不足，构建时影响运行中的服务

**应对措施：**
- 监控服务器资源使用情况
- 如影响明显，考虑升级服务器配置或迁移到方案 B（CI 构建）
- 构建时可临时限制资源：`docker build --cpus=1 --memory=1g`

### 风险 2：磁盘空间不足

**风险描述：** 镜像和备份占用过多磁盘空间

**应对措施：**
- 自动清理旧镜像（保留 3 个版本）
- 自动清理旧备份（保留 4 周）
- 定期检查磁盘使用：`df -h`
- 必要时手动清理：`docker system prune -a`

### 风险 3：构建失败导致服务中断

**风险描述：** 新版本构建失败，影响服务可用性

**应对措施：**
- 构建失败时保留旧版本运行（不停止旧容器）
- GitHub Actions 标记部署失败
- 健康检查失败时输出日志便于排查
- 可快速回滚到上一个稳定版本

### 风险 4：GitHub Actions 网络问题

**风险描述：** GitHub Actions 到腾讯云服务器网络不稳定

**应对措施：**
- SCP 和 SSH 操作设置重试机制（appleboy actions 内置）
- 如持续出现问题，可考虑方案 C（Webhook）
- 或使用国内 CI 服务（如腾讯云 CODING DevOps）

## 11. 后续优化方向

### 短期（1-3 个月）

1. **监控完善**
   - 集成 ntfy.sh 推送通知
   - 添加磁盘空间监控告警

2. **备份优化**
   - 备份文件上传到腾讯云 COS（异地备份）
   - 增加备份验证机制

### 中期（3-6 个月）

1. **测试环境**
   - 如需求增长，添加测试环境
   - 实现 dev → staging → production 流程

2. **CI 增强**
   - 添加代码质量检查（ESLint、代码覆盖率）
   - 添加自动化测试

### 长期（6-12 个月）

1. **多服务器支持**
   - 如需负载均衡，迁移到方案 B（镜像仓库）
   - 实现蓝绿部署或金丝雀发布

2. **容器编排**
   - 如服务增多，考虑引入 Kubernetes 或 Docker Swarm
   - 实现更高级的服务管理和自动扩缩容

## 12. 总结

本设计方案通过在现有架构基础上进行针对性优化，预期可将部署时间从 5-10 分钟降低到 1-2 分钟，提升 70-80%。同时引入版本管理、自动备份、基础监控等功能，显著提升系统的可维护性和可靠性。

方案的核心优势在于：
- **适合国内网络环境** - 配置国内镜像源，避免跨境网络延迟
- **改动最小** - 在现有架构上优化，风险低
- **效果明显** - 构建速度大幅提升，回滚能力显著增强
- **成本低** - 零额外费用，仅需服务器资源

实施完成后，可支持每天多次高频部署，问题发现后可在 15 秒内快速回滚，数据安全有自动备份保障，基本满足中小型项目的自动化部署需求。
