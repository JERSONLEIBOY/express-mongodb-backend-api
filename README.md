# Express + MongoDB 后台管理后端接口

基于 Express.js 和 MongoDB 的后台管理系统后端接口模板，为前端框架提供完整的后端服务支持。

## 项目概述

Node.js + Express + MongoDB 技术栈的 RESTful API 服务，覆盖用户、角色、菜单、机构、字典、文件、日志审计等典型后台模块。身份认证使用 JWT，部署支持 Docker / PM2。

本仓库的操作日志/登录日志模块按行业主流实现重构：参数脱敏、显式标注（`audit()`）、`businessType` 业务类型、TraceId 全链路追踪、IP 归属地解析、TTL 自动过期、内存队列批量写库。详见下文 [审计日志](#审计日志)。

## 技术栈

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

## 项目结构

```
express_mongoodb/
├── src/
│   ├── app.js                          # Express 应用入口
│   ├── config/
│   │   ├── index.js                    # 配置（DB / JWT / 日志）
│   │   ├── swagger.js                  # Swagger 配置
│   │   └── swagger-simple.js
│   ├── routes/
│   │   ├── index.js                    # 路由汇总
│   │   ├── auth.routes.js              # 认证（含验证码、登录限流）
│   │   ├── user.routes.js
│   │   ├── role.routes.js
│   │   ├── menu.routes.js
│   │   ├── organization.routes.js
│   │   ├── dictionary.routes.js
│   │   ├── file.routes.js
│   │   └── log.routes.js               # 登录/操作日志
│   ├── controllers/                    # 控制器层
│   ├── models/
│   │   ├── User.js / Role.js / Menu.js
│   │   ├── Organization.js
│   │   ├── Dictionary.js / DictionaryItem.js
│   │   ├── File.js
│   │   ├── LoginLog.js                 # 登录日志（TTL 索引）
│   │   └── OperationLog.js             # 操作日志（TTL 索引 + businessType + traceId + location）
│   ├── middlewares/
│   │   ├── auth.middleware.js          # JWT 鉴权 + RBAC
│   │   ├── error.middleware.js         # 统一错误处理
│   │   ├── trace.middleware.js         # X-Request-Id / TraceId
│   │   └── logger.middleware.js        # 操作日志 + audit() 标注
│   ├── utils/
│   │   ├── response.js                 # 统一响应 + 全局时间格式化
│   │   ├── formatters.js               # role/menu 输出格式化
│   │   ├── jwt.js
│   │   ├── password.js
│   │   ├── captchaStore.js             # 验证码内存存储
│   │   ├── ipLocation.js               # IP 归属地解析
│   │   └── operationLogQueue.js        # 操作日志内存队列 + 批量 insertMany
│   ├── scripts/
│   │   ├── init-data.js                # 初始化数据
│   │   └── cleanup-legacy-fields.js    # 历史字段清理
│   └── uploads/                        # 文件上传目录
├── docker/
│   └── Dockerfile
├── docker-compose.yml
├── pm2.config.js
├── package.json
├── .env.example
└── README.md
```

## API 文档

启动服务后访问：

- Swagger UI：<http://localhost:3000/api-docs>
- 健康检查：<http://localhost:3000/health>

## 功能模块

API 统一前缀：`/api/v1`

### 1. 认证 `/api/v1/auth`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/captcha` | 获取登录图形验证码 |
| POST | `/login` | 用户登录（带验证码校验，生产环境登录限流 15 分钟 10 次） |
| POST | `/logout` | 用户登出 |
| GET  | `/current-user` | 获取当前用户信息（含菜单与角色） |
| POST | `/refresh` | 续签 Token |

### 2. 用户管理 `/api/v1/users`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET    | `/page` | 分页查询 |
| GET    | `/` | 不分页列表 |
| GET    | `/existence` | 用户名/手机/邮箱重复校验 |
| GET    | `/:id` | 详情 |
| POST   | `/` | 新增（ADMIN） |
| POST   | `/import` | Excel 批量导入（ADMIN） |
| PUT    | `/:id` | 修改（ADMIN） |
| PUT    | `/:id/status` | 状态切换（ADMIN） |
| PUT    | `/:id/password` | 重置密码（ADMIN） |
| DELETE | `/:id` | 删除（ADMIN） |
| DELETE | `/batch` | 批量删除（ADMIN） |

### 3. 角色管理 `/api/v1/roles`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/page` / `/` / `/:id` | 查询 |
| POST | `/` | 新增（ADMIN） |
| PUT | `/:id` | 修改（ADMIN） |
| PUT | `/:id/menus` | 分配菜单权限（ADMIN） |
| DELETE | `/:id` | 删除（ADMIN） |

预置角色：`ADMIN`（管理员）、`USER`（普通用户）、`GUEST`（游客）

### 4. 菜单管理 `/api/v1/menus`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 树形菜单 |
| GET | `/:id` | 详情 |
| POST / PUT / DELETE | `/...` | 维护（ADMIN） |

菜单类型 `menuType`：0 目录 / 1 菜单 / 2 外链

### 5. 机构管理 `/api/v1/organizations`

树形组织架构，支持 公司 / 部门 / 小组 多层级。

### 6. 字典管理 `/api/v1/dictionaries`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` / `/page` | 字典分类查询 |
| GET | `/:code/items` | 字典项查询 |
| GET | `/data?dictCode=xxx` | 通过编码取字典数据 |
| POST / PUT / DELETE | `/...` | 维护 |

预置字典：性别（sex）、机构类型（organization_type）、状态等。

### 7. 文件管理 `/api/v1/files`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/page` | 分页列表 |
| GET | `/:id` | 详情 |
| POST | `/upload` | 上传（单文件，默认 10MB） |
| GET | `/:id/download` | 下载 |
| DELETE | `/:id` | 删除 |

### 8. 日志 `/api/v1/logs`

#### 登录日志

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/login-logs/page` | 分页查询 |
| GET | `/login-logs` | 不分页查询 |
| DELETE | `/login-logs` | 清理（ADMIN） |

`loginType`：0 登录成功 / 1 登录失败 / 2 退出登录 / 3 续签 Token

#### 操作日志

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/operation-logs/page` | 分页查询 |
| GET | `/operation-logs` | 不分页查询 |
| DELETE | `/operation-logs` | 清理（ADMIN） |

`businessType`：`INSERT` / `UPDATE` / `DELETE` / `GRANT` / `EXPORT` / `IMPORT` / `CLEAN` / `OTHER`

## 审计日志

操作日志采用业界主流做法重构，要点如下：

### 1. 记录策略

- **默认**：仅记录 `POST / PUT / DELETE / PATCH` 写操作
- **显式标注**：通过 `audit()` 中间件给特定路由打标，未标注的写操作仍按默认规则记录；标注后可：
  - 自定义 `module`、`businessType`、`description`
  - 让敏感 GET（如导出、查看密钥）也进入审计
  - 用 `audit({ skip: true })` 对心跳/回调等接口显式跳过

```js
const { audit } = require('./middlewares/logger.middleware');

router.post('/',         audit({ module: '用户管理', businessType: 'INSERT', description: '新增用户' }), ctrl.create);
router.get('/export',    audit({ businessType: 'EXPORT', description: '导出用户' }),                    ctrl.export);
router.post('/heartbeat',audit({ skip: true }),                                                          ctrl.heartbeat);
```

### 2. 敏感字段脱敏

`password`、`oldPassword`、`newPassword`、`confirmPassword`、`token`、`accessToken`、`refreshToken`、`captcha`、`verifyCode`、`idCard`、`secret`、`apiKey` 等键在写入 `params` 前会被递归替换为 `******`，原始 key 保留以便排查"是否传过该字段"。

### 3. TraceId 全链路追踪

`src/middlewares/trace.middleware.js`：

- 请求头存在 `X-Request-Id` 则沿用（便于网关 / 上游传入）
- 否则生成 UUID
- 挂在 `req.traceId`，并回写响应头 `X-Request-Id`
- access log / operation log 都会带上同一 traceId，便于跨日志检索

### 4. IP 归属地

`src/utils/ipLocation.js` 基于 `geoip-lite` 离线 IP 库：

- `::1` / `127.0.0.1` / `10.x` / `192.168.x` / `172.16-31.x` / IPv6 私网 / `::ffff:` 映射 → `内网IP`
- 公网 IP → `国家 城市/省份`（如 `美国`、`中国`）
- 无法识别 → `未知`

### 5. 错误信息记录

中间件包装 `res.json` 捕获响应体：

- HTTP `2xx`：成功，`result` 字段不落库（避免日志膨胀和隐私问题）
- HTTP `4xx/5xx`：失败，把响应体的 `message` / `error` 截断到 500 字写入 `error` 字段

### 6. 异步队列化写入

`src/utils/operationLogQueue.js`：

- `push()` 非阻塞入队，立刻返回
- 满足 `BATCH_SIZE=50` 或每 `2s` 批量 `insertMany`
- 队列溢出保护 `MAX_QUEUE_SIZE=1000`，超过丢弃最早一条
- 进程退出时（SIGINT / SIGTERM / beforeExit）尝试 flush
- 写入失败仅记录 `winston` 日志，不影响业务请求

### 7. TTL 自动过期

`LoginLog` / `OperationLog` 都建立了 `createdAt` 上的 TTL 索引，过期天数读取 `LOG_RETENTION_DAYS`（默认 30 天）。修改 `.env` 后执行 `mongoose.syncIndexes()`（或重启服务）即可应用。

### 8. 时间字段统一

所有响应中的 `Date` 字段由 `src/utils/response.js` 的 `normalizeData` 自动按 `Asia/Shanghai` 时区格式化为 `yyyy-MM-dd HH:mm:ss`，无需各 controller 自行处理。时区可通过 `RESPONSE_TIME_ZONE` 环境变量覆盖。

## 统一响应格式

所有接口经 `response.success / paginated / badRequest / ...` 出口返回：

```json
{ "code": 200, "message": "操作成功", "data": { } }
```

分页：

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "list": [],
    "pagination": { "total": 100, "page": 1, "pageSize": 20, "totalPages": 5 }
  }
}
```

特别地：

- `Date` 自动格式化为 `yyyy-MM-dd HH:mm:ss`
- `ObjectId` 自动序列化为字符串

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- MongoDB >= 6.0
- Docker（可选）
- PM2（可选）

### 本地开发

```bash
git clone <repository-url>
cd express_mongoodb

npm install

cp .env.example .env       # 按需修改

# 启动 MongoDB（本机或 Docker）
docker run -d -p 27017:27017 --name mongodb mongo:6

npm run init-data           # 初始化基础数据
npm run dev                 # nodemon 热重载
```

### Docker 部署

```bash
cp .env.example .env
docker-compose up -d
docker-compose ps
docker-compose logs -f app
docker-compose exec app npm run init-data
```

### PM2 生产部署

```bash
npm install --production
cp .env.example .env

pm2 start pm2.config.js --env production
pm2 save
pm2 startup
```

## 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| NODE_ENV | development | 运行环境 |
| PORT | 3000 | 服务端口 |
| MONGODB_URI | mongodb://localhost:27017/ele_admin | MongoDB 连接 |
| JWT_SECRET | default-secret-change-me | JWT 密钥（生产必须修改） |
| JWT_EXPIRES_IN | 7d | Token 过期时间 |
| CORS_ORIGIN | * | CORS 白名单 |
| LOG_RETENTION_DAYS | 30 | 日志 TTL（天） |
| RESPONSE_TIME_ZONE | Asia/Shanghai | 响应时间格式化时区 |
| UPLOAD_PATH | ./src/uploads | 文件上传目录 |
| UPLOAD_MAX_SIZE | 10485760 | 单文件大小上限（10MB） |

## 默认账户

初始化数据后内置以下账户：

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | ADMIN | 系统管理员 |
| testuser | test123 | USER | 普通用户 |
| guestuser | guest123 | GUEST | 只读访客 |

## 数据库设计

> 字段为关键字段，完整定义见 `src/models/*.js`。

### User

| 字段 | 类型 | 说明 |
|------|------|------|
| username | String | 账号（唯一） |
| nickname | String | 昵称 |
| avatar / sex / phone / email / birthday | - | 资料 |
| password | String | bcrypt 哈希存储 |
| status | Number | 0 正常 / 1 冻结 |
| organizationId | ObjectId | 所属机构 |
| roles | [ObjectId] | 角色列表 |

### Role

| 字段 | 类型 | 说明 |
|------|------|------|
| roleName | String | 名称 |
| roleCode | String | 编码（唯一，自动大写） |
| menus | [ObjectId] | 关联菜单 |

### Menu

| 字段 | 类型 | 说明 |
|------|------|------|
| title | String | 名称 |
| menuType | Number | 0 目录 / 1 菜单 / 2 外链 |
| path / component / redirect | String | 路由信息 |
| parentId | String | 父菜单 ID，根为 `'0'` |
| sortNumber / icon / hide / authority | - | 展示与权限 |

### Organization

| 字段 | 类型 | 说明 |
|------|------|------|
| organizationName / organizationFullName | String | 机构名 |
| organizationCode | String | 编码 |
| organizationType | String | 类型（取自字典） |
| parentId | String | 父级 ID，根为 `'0'` |

### LoginLog

| 字段 | 类型 | 说明 |
|------|------|------|
| username / nickname | String | 操作人 |
| os / device / browser | String | UA 解析 |
| ip / location | String | IP + 归属地 |
| loginType | Number | 0 成功 / 1 失败 / 2 登出 / 3 续签 |
| comments | String | 备注（失败原因） |
| createdAt | Date | TTL：`LOG_RETENTION_DAYS` 天后自动删除 |

### OperationLog

| 字段 | 类型 | 说明 |
|------|------|------|
| userId | ObjectId | 操作人 |
| traceId | String | 全链路追踪 ID |
| module | String | 模块（默认取 URL 第 3 段，可被 `audit()` 覆盖） |
| businessType | String | 业务类型枚举 |
| description | String | 业务语义描述 |
| url / requestMethod / method | String | 请求信息 |
| params | String | 已脱敏的请求参数 JSON |
| result | String | 成功时不落库 |
| error | String | 失败时取响应体 message（截断 500 字） |
| spendTime | Number | 耗时（ms） |
| os / device / browser | String | UA 解析 |
| ip / location | String | IP + 归属地 |
| status | Number | 0 成功 / 1 异常 |
| createdAt | Date | TTL：`LOG_RETENTION_DAYS` 天后自动删除 |

## 安全特性

- **密码加密**：bcryptjs（pre-save 钩子自动哈希）
- **JWT 鉴权**：`Authorization: Bearer <token>`
- **RBAC**：`authorize('ADMIN')` 等角色守卫
- **登录限流**：生产环境 15 分钟 10 次
- **验证码**：登录前需先 `GET /api/v1/auth/captcha`
- **Helmet**：HTTP 安全头
- **CORS 白名单**：通过 `CORS_ORIGIN` 配置
- **审计日志**：脱敏 + TraceId + 业务标注
- **统一错误处理**：避免堆栈泄漏

## 部署架构

```
                 ┌─────────────┐
                 │   Client    │
                 └──────┬──────┘
                        │ HTTP/HTTPS
                 ┌──────▼──────┐
                 │  Nginx/CDN  │
                 └──────┬──────┘
                        │
                        ▼
┌─────────────┐  ┌─────────────┐
│   MongoDB   │◄─┤  Express    │
│   Port 27017│  │  App :3000  │
└─────────────┘  └─────────────┘
```

## 开发指南

### 新增模块

1. `src/models/` 创建 Mongoose Schema
2. `src/controllers/` 编写控制器
3. `src/routes/` 创建路由文件（按规则附 Swagger 注释 + 路由列表）
4. 在 `src/routes/index.js` 注册
5. 如需初始化数据，更新 `src/scripts/init-data.js`

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

## 常见问题

**Q：如何修改 JWT 密钥？**
修改 `.env` 中 `JWT_SECRET` 后重启服务。生产部署务必使用强随机值。

**Q：如何查看日志？**
- 应用日志：`logs/app.log` / `logs/error.log`（winston）
- 访问日志：`logs/access.log`（morgan，combined 格式）
- Docker：`docker-compose logs -f app`
- PM2：`pm2 logs`

**Q：如何调整文件上传大小？**
修改 `.env` 中 `UPLOAD_MAX_SIZE`（单位：字节）。

**Q：如何用 traceId 串联多个日志？**
所有 access log（winston）和操作日志都带 `traceId`。前端可从响应头 `X-Request-Id` 取，或在请求时主动传入相同的 `X-Request-Id`。

**Q：操作日志写入会拖慢主请求吗？**
不会。中间件在 `res.on('finish')` 后异步入队，由后台批量 `insertMany`，主请求不等待 DB。

**Q：如何让某些 GET 接口也进入审计？**
在路由上挂 `audit({ description: '...', businessType: 'EXPORT' })` 即可。

## License

MIT
