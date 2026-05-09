# Express + MongoDB 后台管理后端接口规范

## Why

需要为 Ele Admin Plus 前端系统提供完整的后端接口支持，实现基于 Express + MongoDB 的后台管理后端模板。该系统需要支持 8 个核心功能模块（用户管理、角色管理、菜单管理、机构管理、字典管理、文件管理、登录日志、操作日志），并采用 JWT Token 认证和 RESTful API 设计风格。系统通过 Docker 容器化部署，使用 PM2 管理进程和日志。

## What Changes

### 核心架构
- 基于 Express.js 框架构建 RESTful API 后端服务
- 使用 MongoDB 作为数据存储，支持 Mongoose ODM
- 采用 JWT Token 实现用户身份认证和权限控制
- 使用 Docker 容器化部署，PM2 管理进程和日志

### 技术栈
- **运行时**: Node.js 18+
- **框架**: Express.js 4.x
- **数据库**: MongoDB 6.x + Mongoose 8.x
- **认证**: JWT (jsonwebtoken) + bcrypt 密码加密
- **日志**: Winston + Morgan
- **进程管理**: PM2
- **容器化**: Docker + Docker Compose

### 存储方案
- **文件存储**: 本地磁盘存储 + Docker Volume 持久化
  - 存储路径: `/app/uploads/`
  - Docker Volume: `app-uploads`
  - 单文件大小限制: 10MB
  - 生产阶段可无缝迁移到 S3/MinIO
- **日志保留**: 30 天自动清理
  - MongoDB TTL 索引实现自动删除
  - 登录日志: `loginTime` + `expiresAfterSeconds: 2592000`
  - 操作日志: `operationTime` + `expiresAfterSeconds: 2592000`

### CORS 跨域配置
- 开发环境: CORS 通配符或 localhost
- 生产环境: 通过环境变量 `CORS_ORIGIN` 配置实际前端域名
- 支持凭证: `credentials: true`

### API 设计规范
- **Base URL**: `/api/v1`
- **认证方式**: JWT Bearer Token
- **请求格式**: JSON
- **响应格式**: 统一响应结构 `{ code, message, data }`
- **分页规范**: `page` + `pageSize`，默认 pageSize=20
- **排序规范**: `sortField` + `sortOrder`
- **状态码**: 200成功、400客户端错误、401未认证、403禁止、404未找到、500服务器错误

### 8个功能模块

#### 1. 用户管理 `/api/v1/users`
- **功能**: 用户 CRUD、组织架构关联、角色分配
- **字段**: 所属机构、账号(username)、用户名(name)、性别(sex)、角色(roles)、邮箱(email)、手机号(phone)、出生日期(birthday)、密码(password)、状态(status)、个人简介(remark)
- **接口**:
  - `GET /users` - 分页获取用户列表
  - `GET /users/:id` - 获取单个用户
  - `POST /users` - 创建用户
  - `PUT /users/:id` - 更新用户
  - `DELETE /users/:id` - 删除用户
  - `PUT /users/:id/status` - 修改用户状态
  - `PUT /users/:id/password` - 修改密码

#### 2. 角色管理 `/api/v1/roles`
- **功能**: 角色 CRUD、权限分配（菜单权限）
- **字段**: 角色名称(name)、角色编码(code)、备注(remark)、权限列表(permissions)、状态(status)
- **接口**:
  - `GET /roles` - 分页获取角色列表
  - `GET /roles/:id` - 获取单个角色
  - `POST /roles` - 创建角色
  - `PUT /roles/:id` - 更新角色
  - `DELETE /roles/:id` - 删除角色
  - `PUT /roles/:id/permissions` - 更新角色权限

#### 3. 菜单管理 `/api/v1/menus`
- **功能**: 菜单树形配置、层级管理
- **字段**: 菜单名称(name)、菜单类型(type: 目录/菜单/外链)、路由地址(path)、父菜单ID(parentId)、排序号(sort)、图标(icon)、可见性(visible)、组件路径(component)、重定向(redirect)
- **接口**:
  - `GET /menus` - 获取菜单树形列表
  - `GET /menus/:id` - 获取单个菜单
  - `POST /menus` - 创建菜单
  - `PUT /menus/:id` - 更新菜单
  - `DELETE /menus/:id` - 删除菜单

#### 4. 机构管理 `/api/v1/organizations`
- **功能**: 组织架构树形管理
- **字段**: 机构名称(name)、机构类型(type: 公司/部门/小组)、父机构ID(parentId)、排序号(sort)、状态(status)
- **接口**:
  - `GET /organizations` - 获取机构树形列表
  - `GET /organizations/:id` - 获取单个机构
  - `POST /organizations` - 创建机构
  - `PUT /organizations/:id` - 更新机构
  - `DELETE /organizations/:id` - 删除机构

#### 5. 字典管理 `/api/v1/dictionaries`
- **功能**: 字典分类树 + 字典数据管理
- **字段**: 字典分类（字典名称name、字典编码code、状态status）、字典数据（字典项文本label、字典项值value、排序号sort、状态status）
- **接口**:
  - `GET /dictionaries` - 获取字典分类列表
  - `GET /dictionaries/:code/items` - 获取字典项列表
  - `POST /dictionaries` - 创建字典分类
  - `PUT /dictionaries/:id` - 更新字典分类
  - `DELETE /dictionaries/:id` - 删除字典分类
  - `POST /dictionaries/:code/items` - 创建字典项
  - `PUT /dictionaries/:code/items/:itemId` - 更新字典项
  - `DELETE /dictionaries/:code/items/:itemId` - 删除字典项

#### 6. 文件管理 `/api/v1/files`
- **功能**: 文件上传、下载、元数据管理
- **字段**: 文件名称(name)、文件路径(path)、文件大小(size)、文件类型(mimeType)、上传人(uploader)、上传时间(uploadTime)
- **接口**:
  - `GET /files` - 分页获取文件列表
  - `GET /files/:id` - 获取文件信息
  - `POST /files/upload` - 上传文件
  - `DELETE /files/:id` - 删除文件
  - `GET /files/:id/download` - 下载文件

#### 7. 登录日志 `/api/v1/login-logs`
- **功能**: 登录行为记录
- **字段**: 用户名(username)、登录时间(loginTime)、IP地址(ip)、设备(device)、操作系统(os)、浏览器(browser)、操作类型(loginType: 登录成功/登录失败/刷新TOKEN)、状态(status)
- **接口**:
  - `GET /login-logs` - 分页获取登录日志
  - `GET /login-logs/:id` - 获取登录日志详情
  - `DELETE /login-logs` - 清理登录日志

#### 8. 操作日志 `/api/v1/operation-logs`
- **功能**: 用户操作记录、API 请求追踪
- **字段**: 操作模块(module)、操作功能(function)、请求地址(url)、请求方式(method)、请求参数(params)、响应数据(data)、操作耗时(duration)、操作状态(status)、操作人(operator)、操作时间(operationTime)
- **接口**:
  - `GET /operation-logs` - 分页获取操作日志
  - `GET /operation-logs/:id` - 获取操作日志详情
  - `DELETE /operation-logs` - 清理操作日志

### 认证接口

#### 1. 登录 `/api/v1/auth/login`
- **请求**: `{ username, password }`
- **响应**: `{ token, user: { id, username, name, roles } }`

#### 2. 登出 `/api/v1/auth/logout`
- **响应**: `{ message: "登出成功" }`

#### 3. 获取当前用户信息 `/api/v1/auth/current-user`
- **响应**: `{ user: { id, username, name, roles, permissions } }`

#### 4. 刷新 Token `/api/v1/auth/refresh`
- **响应**: `{ token }`

## Impact

### 目录结构
```
express_mongoodb/
├── src/
│   ├── app.js                    # Express 应用入口
│   ├── config/
│   │   └── index.js              # 配置文件
│   ├── routes/
│   │   ├── index.js              # 路由汇总
│   │   ├── auth.routes.js         # 认证路由
│   │   ├── user.routes.js         # 用户路由
│   │   ├── role.routes.js         # 角色路由
│   │   ├── menu.routes.js         # 菜单路由
│   │   ├── organization.routes.js  # 机构路由
│   │   ├── dictionary.routes.js    # 字典路由
│   │   ├── file.routes.js          # 文件路由
│   │   └── log.routes.js           # 日志路由
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── role.controller.js
│   │   ├── menu.controller.js
│   │   ├── organization.controller.js
│   │   ├── dictionary.controller.js
│   │   ├── file.controller.js
│   │   └── log.controller.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Role.js
│   │   ├── Menu.js
│   │   ├── Organization.js
│   │   ├── Dictionary.js
│   │   ├── DictionaryItem.js
│   │   ├── File.js
│   │   ├── LoginLog.js
│   │   └── OperationLog.js
│   ├── middlewares/
│   │   ├── auth.middleware.js     # JWT 认证中间件
│   │   ├── logger.middleware.js   # 日志中间件
│   │   └── error.middleware.js    # 错误处理中间件
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   └── ...
│   ├── utils/
│   │   ├── response.js            # 统一响应工具
│   │   ├── jwt.js                 # JWT 工具
│   │   └── password.js            # 密码加密工具
│   └── uploads/                   # 文件上传目录
├── docker/
│   └── Dockerfile
├── docker-compose.yml
├── pm2.config.js
├── package.json
└── .env.example
```

### 部署架构
- **MongoDB**: 通过 Docker Compose 独立容器运行
- **Node.js App**: 通过 PM2 管理，使用 Docker 容器化部署
- **日志**: Winston 输出到文件，PM2 日志管理

## ADDED Requirements

### Requirement: 用户认证系统
系统 SHALL 提供基于 JWT Token 的用户认证功能，包括登录、登出、Token 刷新、获取当前用户信息。

#### Scenario: 用户登录成功
- **WHEN** 用户提交正确的用户名和密码
- **THEN** 返回 JWT Token 和用户基本信息

#### Scenario: 用户登录失败
- **WHEN** 用户提交错误的用户名或密码
- **THEN** 返回 401 错误，提示"用户名或密码错误"

#### Scenario: Token 过期
- **WHEN** 用户请求携带过期 Token
- **THEN** 返回 401 错误，提示"Token 已过期"

### Requirement: RBAC 权限控制
系统 SHALL 提供基于角色的权限控制（Role-Based Access Control），用户绑定角色，角色绑定菜单权限。

#### Scenario: 权限验证
- **WHEN** 用户访问受保护的接口
- **THEN** 验证用户角色是否具有对应权限

### Requirement: 操作日志审计
系统 SHALL 记录所有需要审计的操作，支持按时间范围、操作模块、操作人筛选。

#### Scenario: 记录操作日志
- **WHEN** 用户执行增删改操作
- **THEN** 记录操作人、操作时间、操作类型、操作参数、响应结果、耗时

### Requirement: 文件上传管理
系统 SHALL 提供文件上传、下载、删除功能，支持常见文件类型。

#### Scenario: 文件上传
- **WHEN** 用户上传文件
- **THEN** 保存文件到服务器，返回文件元数据

### Requirement: 数据初始化
系统 SHALL 提供数据初始化功能，包括：
- 创建默认管理员账户（admin/admin123）
- 创建默认角色（管理员 admin、普通用户 user、游客 guest）
- 创建基础菜单结构（系统管理模块相关菜单）
- 创建基础字典数据（性别 sex、机构类型 organization_type、状态 status）
- 创建演示用户数据（testuser、guestuser）

## MODIFIED Requirements

无

## REMOVED Requirements

无
