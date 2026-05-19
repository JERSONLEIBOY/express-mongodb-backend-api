# Express + MongoDB 后台管理后端接口

基于 Express.js 和 MongoDB 的后台管理系统后端接口模板，为前端框架提供完整的后端服务支持。

## 项目概述

本项目是一个现代化的后台管理后端接口系统，采用 Node.js + Express + MongoDB 技术栈实现 RESTful API 接口服务。系统支持用户管理、角色管理、菜单管理、机构管理、字典管理、文件管理、日志审计等核心功能，采用 JWT Token 进行身份认证，通过 Docker 容器化部署，PM2 管理进程和日志。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | >=18.0.0 | JavaScript 运行时 |
| Express.js | 4.x | Web 框架 |
| MongoDB | 6.x | 文档数据库 |
| Mongoose | 8.x | MongoDB ODM |
| JWT | jsonwebtoken | Token 认证 |
| bcryptjs | - | 密码加密 |
| Winston | - | 日志管理 |
| PM2 | - | 进程管理 |
| Docker | - | 容器化部署 |

## 项目结构

```
express_mongoodb/
├── src/
│   ├── app.js                      # Express 应用入口
│   ├── config/
│   │   └── index.js                # 配置文件（数据库、JWT、日志等）
│   ├── routes/
│   │   ├── index.js                # 路由汇总
│   │   ├── auth.routes.js           # 认证路由
│   │   ├── user.routes.js           # 用户管理路由
│   │   ├── role.routes.js           # 角色管理路由
│   │   ├── menu.routes.js           # 菜单管理路由
│   │   ├── organization.routes.js   # 机构管理路由
│   │   ├── dictionary.routes.js      # 字典管理路由
│   │   ├── file.routes.js           # 文件管理路由
│   │   └── log.routes.js            # 日志路由
│   ├── controllers/
│   │   ├── auth.controller.js       # 认证控制器
│   │   ├── user.controller.js       # 用户控制器
│   │   ├── role.controller.js       # 角色控制器
│   │   ├── menu.controller.js       # 菜单控制器
│   │   ├── organization.controller.js # 机构控制器
│   │   ├── dictionary.controller.js  # 字典控制器
│   │   ├── file.controller.js       # 文件控制器
│   │   └── log.controller.js        # 日志控制器
│   ├── models/
│   │   ├── User.js                  # 用户模型
│   │   ├── Role.js                  # 角色模型
│   │   ├── Menu.js                  # 菜单模型
│   │   ├── Organization.js          # 机构模型
│   │   ├── Dictionary.js            # 字典模型
│   │   ├── DictionaryItem.js        # 字典项模型
│   │   ├── File.js                  # 文件模型
│   │   ├── LoginLog.js              # 登录日志模型
│   │   └── OperationLog.js          # 操作日志模型
│   ├── middlewares/
│   │   ├── auth.middleware.js       # JWT 认证中间件
│   │   ├── error.middleware.js      # 错误处理中间件
│   │   └── logger.middleware.js     # 操作日志中间件
│   ├── utils/
│   │   ├── response.js              # 统一响应工具
│   │   ├── jwt.js                   # JWT 工具
│   │   └── password.js              # 密码加密工具
│   ├── scripts/
│   │   └── init-data.js             # 数据初始化脚本
│   └── uploads/                     # 文件上传目录
├── docker/
│   └── Dockerfile                   # Docker 构建文件
├── docker-compose.yml              # Docker Compose 配置
├── package.json                    # 项目依赖配置
├── pm2.config.js                   # PM2 进程管理配置
├── .env.example                    # 环境变量示例
└── README.md                       # 项目文档
```

## 功能模块

本系统包含 8 个核心功能模块：

### 1. 用户管理 `/api/v1/users`
- 用户 CRUD 操作（创建、读取、更新、删除）
- 组织架构关联
- 角色分配
- 状态管理（正常/禁用/锁定）
- 密码修改

### 2. 角色管理 `/api/v1/roles`
- 角色 CRUD 操作
- 菜单权限分配
- 预置角色：管理员(ADMIN)、普通用户(USER)、游客(GUEST)

### 3. 菜单管理 `/api/v1/menus`
- 树形菜单结构
- 菜单类型：目录、菜单、外链
- 层级关系管理
- 路由和组件配置

### 4. 机构管理 `/api/v1/organizations`
- 树形组织架构
- 机构类型：公司、部门、小组
- 层级关系管理

### 5. 字典管理 `/api/v1/dictionaries`
- 字典分类管理
- 字典项管理
- 预置字典：性别、机构类型、状态

### 6. 文件管理 `/api/v1/files`
- 文件上传（支持常见文件类型）
- 文件下载
- 文件元数据管理
- 单文件大小限制：10MB

### 7. 登录日志 `/api/v1/login-logs`
- 登录行为记录
- IP 地址、设备、操作系统、浏览器信息
- 登录类型：登录成功、登录失败、刷新 Token
- 自动清理：30 天保留期

### 8. 操作日志 `/api/v1/operation-logs`
- 用户操作记录
- API 请求追踪
- 操作耗时统计
- 自动清理：30 天保留期

## API 接口

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/login` | 用户登录 |
| POST | `/api/v1/auth/logout` | 用户登出 |
| GET | `/api/v1/auth/current-user` | 获取当前用户信息 |
| POST | `/api/v1/auth/refresh` | 刷新 Token |

### 用户管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/users` | 分页获取用户列表 |
| GET | `/api/v1/users/:id` | 获取单个用户 |
| POST | `/api/v1/users` | 创建用户 |
| PUT | `/api/v1/users/:id` | 更新用户 |
| DELETE | `/api/v1/users/:id` | 删除用户 |
| PUT | `/api/v1/users/:id/status` | 修改用户状态 |
| PUT | `/api/v1/users/:id/password` | 修改密码 |

### 角色管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/roles` | 分页获取角色列表 |
| GET | `/api/v1/roles/:id` | 获取单个角色 |
| POST | `/api/v1/roles` | 创建角色 |
| PUT | `/api/v1/roles/:id` | 更新角色 |
| DELETE | `/api/v1/roles/:id` | 删除角色 |
| PUT | `/api/v1/roles/:id/permissions` | 更新角色权限 |

### 菜单管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/menus` | 获取菜单树形列表 |
| GET | `/api/v1/menus/:id` | 获取单个菜单 |
| POST | `/api/v1/menus` | 创建菜单 |
| PUT | `/api/v1/menus/:id` | 更新菜单 |
| DELETE | `/api/v1/menus/:id` | 删除菜单 |

### 机构管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/organizations` | 获取机构树形列表 |
| GET | `/api/v1/organizations/:id` | 获取单个机构 |
| POST | `/api/v1/organizations` | 创建机构 |
| PUT | `/api/v1/organizations/:id` | 更新机构 |
| DELETE | `/api/v1/organizations/:id` | 删除机构 |

### 字典管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/dictionaries` | 获取字典分类列表 |
| GET | `/api/v1/dictionaries/:code/items` | 获取字典项列表 |
| GET | `/api/v1/dictionaries/data?dictCode=organization_type` | 通过字典编码获取字典数据 |
| POST | `/api/v1/dictionaries` | 创建字典分类 |
| PUT | `/api/v1/dictionaries/:id` | 更新字典分类 |
| DELETE | `/api/v1/dictionaries/:id` | 删除字典分类 |
| POST | `/api/v1/dictionaries/:code/items` | 创建字典项 |
| PUT | `/api/v1/dictionaries/:code/items/:itemId` | 更新字典项 |
| DELETE | `/api/v1/dictionaries/:code/items/:itemId` | 删除字典项 |

### 文件管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/files` | 分页获取文件列表 |
| GET | `/api/v1/files/:id` | 获取文件信息 |
| POST | `/api/v1/files/upload` | 上传文件 |
| DELETE | `/api/v1/files/:id` | 删除文件 |
| GET | `/api/v1/files/:id/download` | 下载文件 |

### 日志管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/login-logs` | 分页获取登录日志 |
| GET | `/api/v1/login-logs/:id` | 获取登录日志详情 |
| DELETE | `/api/v1/login-logs` | 清理登录日志 |
| GET | `/api/v1/operation-logs` | 分页获取操作日志 |
| GET | `/api/v1/operation-logs/:id` | 获取操作日志详情 |
| DELETE | `/api/v1/operation-logs` | 清理操作日志 |

## 统一响应格式

所有 API 接口返回统一响应格式：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": { }
}
```

分页响应格式：

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "list": [],
    "pagination": {
      "total": 100,
      "page": 1,
      "pageSize": 20,
      "totalPages": 5
    }
  }
}
```

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- MongoDB >= 6.0
- Docker >= 20.x (可选)
- PM2 (可选)

### 本地开发

```bash
# 1. 克隆项目
git clone <repository-url>
cd express_mongoodb

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，修改必要的配置

# 4. 启动 MongoDB (本地或 Docker)
# Docker 方式:
docker run -d -p 27017:27017 --name mongodb mongo:6

# 5. 初始化数据
npm run init-data

# 6. 启动开发服务器
npm run dev
```

### Docker 部署

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 2. 启动所有服务 (MongoDB + App)
docker-compose up -d

# 3. 查看服务状态
docker-compose ps

# 4. 查看日志
docker-compose logs -f app

# 5. 初始化数据
docker-compose exec app npm run init-data
```

### PM2 生产部署

```bash
# 1. 安装依赖
npm install --production

# 2. 配置环境变量
cp .env.example .env

# 3. 启动服务
pm2 start pm2.config.js --env production

# 4. 保存进程列表
pm2 save

# 5. 设置开机自启
pm2 startup
```

## 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| NODE_ENV | development | 运行环境 |
| PORT | 3000 | 服务端口 |
| MONGODB_URI | mongodb://localhost:27017/ele_admin | MongoDB 连接地址 |
| JWT_SECRET | default-secret-change-me | JWT 密钥 |
| JWT_EXPIRES_IN | 7d | Token 过期时间 |
| CORS_ORIGIN | * | CORS 跨域配置 |
| LOG_RETENTION_DAYS | 30 | 日志保留天数 |
| UPLOAD_PATH | ./src/uploads | 文件上传路径 |
| UPLOAD_MAX_SIZE | 10485760 | 单文件大小限制 (10MB) |

### CORS 配置

开发环境：默认允许所有来源

生产环境：建议配置实际的前端域名

```javascript
// .env
CORS_ORIGIN=https://your-frontend-domain.com
```

## 默认账户

初始化数据时会创建以下默认账户：

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | 管理员 | 系统管理员，拥有所有权限 |
| testuser | test123 | 普通用户 | 测试用户账号 |
| guestuser | guest123 | 游客 | 访客账号，仅有查看权限 |

## 数据库设计

### 用户模型 (User)

| 字段 | 类型 | 说明 |
|------|------|------|
| username | String | 用户账号（唯一） |
| name | String | 用户姓名 |
| sex | String | 性别 (male/female/unknown) |
| email | String | 邮箱 |
| phone | String | 手机号 |
| birthday | Date | 出生日期 |
| password | String | 密码（加密存储） |
| status | String | 状态 (active/inactive/locked) |
| remark | String | 个人简介 |
| organization | ObjectId | 所属机构 |
| roles | Array | 所属角色列表 |

### 角色模型 (Role)

| 字段 | 类型 | 说明 |
|------|------|------|
| name | String | 角色名称 |
| code | String | 角色编码（唯一，大写） |
| remark | String | 备注 |
| permissions | Array | 菜单权限列表 |
| status | String | 状态 (active/inactive) |

### 菜单模型 (Menu)

| 字段 | 类型 | 说明 |
|------|------|------|
| name | String | 菜单名称 |
| type | String | 类型 (directory/menu/external) |
| path | String | 路由地址 |
| parentId | ObjectId | 父菜单 ID |
| sort | Number | 排序号 |
| icon | String | 菜单图标 |
| visible | Boolean | 是否可见 |
| component | String | 组件路径 |
| redirect | String | 重定向地址 |

### 机构模型 (Organization)

| 字段 | 类型 | 说明 |
|------|------|------|
| name | String | 机构名称 |
| type | String | 类型 (company/department/team) |
| parentId | ObjectId | 父机构 ID |
| sort | Number | 排序号 |
| status | String | 状态 (active/inactive) |

### 日志模型 (LoginLog / OperationLog)

- LoginLog: 30 天自动清理 (TTL 索引)
- OperationLog: 30 天自动清理 (TTL 索引)

## 安全特性

- **密码加密**: 使用 bcryptjs 进行密码哈希
- **JWT Token**: 基于 Token 的身份认证
- **RBAC**: 基于角色的权限控制
- **Helmet**: HTTP 头部安全
- **输入验证**: 请求参数验证
- **错误处理**: 统一的错误处理机制
- **操作审计**: 完整的操作日志记录

## 部署架构

```
                    ┌─────────────┐
                    │   Client    │
                    └──────┬──────┘
                           │
                           │ HTTP/HTTPS
                           │
                    ┌──────▼──────┐
                    │  Nginx/CDN  │
                    └──────┬──────┘
                           │
                           ▼
┌─────────────┐     ┌─────────────┐
│   MongoDB   │◄────│  Express    │
│   (Docker)  │     │   App       │
│   Port 27017│     │  (Docker)   │
└─────────────┘     │  Port 3000  │
                    └─────────────┘
```

## 开发指南

### 添加新模块

1. 在 `src/models/` 创建数据模型
2. 在 `src/controllers/` 创建控制器
3. 在 `src/routes/` 创建路由
4. 在 `src/routes/index.js` 注册路由
5. 更新数据初始化脚本（如需要）

### 添加新接口

1. 在对应的控制器中添加方法
2. 在对应的路由文件中注册路由
3. 添加对应的中间件（如需要权限验证）

## 常见问题

### Q: 如何修改 JWT 密钥？
A: 修改 `.env` 文件中的 `JWT_SECRET` 值，并重启服务。

### Q: 如何查看日志？
A: 本地开发查看控制台输出；Docker 部署使用 `docker-compose logs -f app`；PM2 部署使用 `pm2 logs`。

### Q: 如何备份 MongoDB 数据？
A: 使用 `docker-compose exec mongodb mongodump` 或 MongoDB 官方工具。

### Q: 文件上传大小限制如何调整？
A: 修改 `.env` 文件中的 `UPLOAD_MAX_SIZE` 值。

## License

MIT License

## 联系方式

如有问题，请提交 Issue 或联系开发者。
