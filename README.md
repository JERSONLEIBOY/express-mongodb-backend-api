# Express + MongoDB 后台管理后端接口

基于 Express.js 和 MongoDB 的后台管理系统后端接口模板，为前端框架提供完整的后端服务支持。

## 🚀 快速开始

### 本地开发

```bash
git clone <repository-url>
cd express-mongodb-backend-api

npm install
cp .env.example .env

# 启动 MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:6

# 初始化数据
npm run init-data

# 启动开发服务器
npm run dev
```

### 自动化部署

项目已配置 GitHub Actions 自动化部署，推送到 `main` 分支即可自动部署到生产服务器。

**详细部署文档请查看：[DEPLOYMENT.md](./DEPLOYMENT.md)**

快速部署步骤：
1. 初始化服务器（首次部署）
2. 配置 GitHub Secrets
3. 推送代码到 main 分支
4. 自动部署完成

## 📚 项目概述

Node.js + Express + MongoDB 技术栈的 RESTful API 服务，覆盖用户、角色、菜单、机构、字典、文件、日志审计等典型后台模块。身份认证使用 JWT，部署支持 Docker / PM2。

本仓库的操作日志/登录日志模块按行业主流实现重构：参数脱敏、显式标注（`audit()`）、`businessType` 业务类型、TraceId 全链路追踪、IP 归属地解析、TTL 自动过期、内存队列批量写库。详见下文 [审计日志](#审计日志)。

## 🛠 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | >=18.0.0 | JavaScript 运行时 |
| Express.js | 4.x | Web 框架 |
| MongoDB | 6.x | 文档数据库 |
| Mongoose | 8.x | MongoDB ODM |
| jsonwebtoken | 9.x | JWT Token 认证 |
| bcryptjs | 2.x | 密码哈希 |
| helmet | 7.x | HTTP 安全头 |
| express-rate-limit | 8.x | 接口限流 |
| multer | 1.x | 文件上传 |
| svg-captcha | 1.x | 登录图形验证码 |
| ua-parser-js | 2.x | User-Agent 解析 |
| geoip-lite | 1.x | IP 归属地解析 |
| swagger-jsdoc / swagger-ui-express | - | API 文档 |
| winston | 3.x | 应用日志 |
| morgan | 1.x | 访问日志 |
| xlsx | 0.18.x | Excel 导入导出 |
| PM2 | 5.x | 进程管理 |
| Docker | - | 容器化部署 |

## 📁 项目结构

```
express_mongoodb/
├── src/
│   ├── app.js                          # Express 应用入口
│   ├── config/
│   │   ├── index.js                    # 配置（DB / JWT / 日志）
│   │   ├── swagger.js                  # Swagger 配置
│   │   └── swagger-simple.js           # 简化版 Swagger 配置
│   ├── routes/
│   │   ├── index.js                    # 路由汇总
│   │   ├── auth.routes.js              # 认证（含验证码、登录限流）
│   │   ├── user.routes.js              # 用户管理
│   │   ├── role.routes.js              # 角色管理
│   │   ├── menu.routes.js              # 菜单管理
│   │   ├── organization.routes.js      # 机构管理
│   │   ├── dictionary.routes.js        # 字典管理
│   │   ├── file.routes.js              # 文件管理
│   │   └── log.routes.js               # 登录/操作日志
│   ├── controllers/                    # 控制器层
│   ├── models/                         # 数据模型
│   ├── middlewares/                    # 中间件
│   ├── utils/                          # 工具函数
│   ├── scripts/                        # 运维脚本
│   └── uploads/                        # 文件上传目录
├── docker/
│   └── Dockerfile                      # Docker 构建文件
├── .github/workflows/
│   └── deploy.yml                      # GitHub Actions 部署配置
├── scripts/
│   ├── server-setup.sh                 # 服务器初始化脚本
│   ├── backup-db.sh                    # 数据库备份脚本
│   └── restore-db.sh                   # 数据库恢复脚本
├── docker-compose.yml                  # Docker Compose 配置
├── pm2.config.js                       # PM2 进程管理配置
├── package.json
├── .env.example                        # 环境变量模板
├── DEPLOYMENT.md                       # 部署文档
└── README.md
```

## 📖 API 文档

启动服务后访问：

- Swagger UI：<http://localhost:3000/api-docs>
- 健康检查：<http://localhost:3000/health>

## 🔐 默认账户

初始化数据后内置以下账户：

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | ADMIN | 系统管理员 |
| testuser | test123 | USER | 普通用户 |
| guestuser | guest123 | GUEST | 只读访客 |

**⚠️ 生产环境请立即修改默认密码**

## 🚢 部署方式

### 方式 1：自动化部署（推荐）

使用 GitHub Actions 自动部署到生产服务器。

**详细步骤请查看：[DEPLOYMENT.md](./DEPLOYMENT.md)**

### 方式 2：Docker Compose

```bash
cp .env.example .env
docker-compose up -d
docker-compose exec app npm run init-data
```

### 方式 3：PM2

```bash
npm install --production
cp .env.example .env
pm2 start pm2.config.js --env production
pm2 save
pm2 startup
```

## 🔧 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| NODE_ENV | development | 运行环境 |
| PORT | 3000 | 服务端口 |
| MONGODB_URI | mongodb://localhost:27017/ele_admin | MongoDB 连接 |
| JWT_SECRET | your-super-secret-jwt-key-change-in-production | JWT 密钥（生产必须修改） |
| JWT_EXPIRES_IN | 7d | Token 过期时间 |
| CORS_ORIGIN | * | CORS 白名单 |
| LOG_RETENTION_DAYS | 30 | 日志 TTL（天） |
| RESPONSE_TIME_ZONE | Asia/Shanghai | 响应时间格式化时区 |
| UPLOAD_PATH | ./src/uploads | 文件上传目录 |
| UPLOAD_MAX_SIZE | 10485760 | 单文件大小上限（10MB） |

## 📊 功能模块

API 统一前缀：`/api/v1`

- ✅ 认证：登录、登出、验证码、Token 刷新
- ✅ 用户管理：CRUD、批量导入、状态管理
- ✅ 角色管理：权限分配、菜单授权
- ✅ 菜单管理：树形结构、动态路由
- ✅ 机构管理：组织架构树
- ✅ 字典管理：系统字典配置
- ✅ 文件管理：上传、下载、删除
- ✅ 日志审计：登录日志、操作日志

详细接口说明请查看 [README 完整版](./README.md) 或访问 Swagger 文档。

## 🔒 审计日志

操作日志采用业界主流做法重构，要点如下：

### 记录策略

- **默认**：仅记录 `POST / PUT / DELETE / PATCH` 写操作
- **显式标注**：通过 `audit()` 中间件给特定路由打标

```js
const { audit } = require('./middlewares/logger.middleware');

router.post('/', audit({ module: '用户管理', businessType: 'INSERT', description: '新增用户' }), ctrl.create);
router.get('/export', audit({ businessType: 'EXPORT', description: '导出用户' }), ctrl.export);
```

### 核心特性

- ✅ **敏感字段脱敏**：密码、Token 等自动替换为 `******`
- ✅ **TraceId 追踪**：全链路请求追踪
- ✅ **IP 归属地**：基于 geoip-lite 离线解析
- ✅ **异步队列**：批量写入，不阻塞主请求
- ✅ **TTL 过期**：自动清理过期日志
- ✅ **时间统一**：所有时间自动格式化为 `yyyy-MM-dd HH:mm:ss`

## 🛡 安全特性

- **密码加密**：bcryptjs（pre-save 钩子自动哈希）
- **JWT 鉴权**：`Authorization: Bearer <token>`
- **RBAC**：`authorize('ADMIN')` 等角色守卫
- **登录限流**：生产环境 15 分钟 10 次
- **验证码**：登录前需先 `GET /api/v1/auth/captcha`
- **Helmet**：HTTP 安全头
- **CORS 白名单**：通过 `CORS_ORIGIN` 配置
- **审计日志**：脱敏 + TraceId + 业务标注
- **统一错误处理**：避免堆栈泄漏

## 📝 开发指南

### 新增接口（强制）

按 `.claude/CLAUDE.md` 项目规则：

1. **Swagger 注释**：在路由定义上方添加 `@swagger` JSDoc
2. **路由列表**：同文件 `GET /` 路由的 `endpoints` 数组中追加条目
3. **自测**：调用接口验证通过后再提交

### 自定义操作日志

在路由上挂 `audit()` 即可显式声明：

```js
const { audit } = require('../middlewares/logger.middleware');

router.put('/:id/permissions',
  audit({ module: '角色管理', businessType: 'GRANT', description: '分配角色权限' }),
  controller.assignMenus
);
```

## 🎯 监控与运维

### 查看日志

```bash
# Docker
docker-compose logs -f app

# PM2
pm2 logs

# 文件
tail -f logs/app.log
tail -f logs/error.log
```

### 数据库备份

```bash
# 手动备份
./scripts/backup-db.sh

# 恢复备份
./scripts/restore-db.sh backup/mongodb_backup_20260618_120000.tar.gz
```

### 健康检查

```bash
curl http://localhost:3000/health
```

## 🤝 常见问题

**Q：如何修改 JWT 密钥？**  
修改 `.env` 中 `JWT_SECRET` 后重启服务。生产部署务必使用强随机值。

**Q：如何调整文件上传大小？**  
修改 `.env` 中 `UPLOAD_MAX_SIZE`（单位：字节）。

**Q：如何用 traceId 串联多个日志？**  
所有 access log（winston）和操作日志都带 `traceId`。前端可从响应头 `X-Request-Id` 取，或在请求时主动传入相同的 `X-Request-Id`。

**Q：操作日志写入会拖慢主请求吗？**  
不会。中间件在 `res.on('finish')` 后异步入队，由后台批量 `insertMany`，主请求不等待 DB。

**Q：部署相关问题？**  
请查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 详细部署文档。

## 📄 License

MIT
