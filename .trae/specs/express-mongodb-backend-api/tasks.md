# Express + MongoDB 后台管理后端接口任务列表

## 项目初始化

- [ ] Task 1.1: 初始化 Node.js 项目结构
  - [ ] SubTask 1.1.1: 创建 package.json 并配置依赖
  - [ ] SubTask 1.1.2: 创建目录结构
  - [ ] SubTask 1.1.3: 创建 .env.example 配置文件
  - [ ] SubTask 1.1.4: 创建 pm2.config.js 配置文件

- [ ] Task 1.2: 创建 Docker 相关配置
  - [ ] SubTask 1.2.1: 创建 Dockerfile
  - [ ] SubTask 1.2.2: 创建 docker-compose.yml（包含 MongoDB 和 Node.js App）

## 公共基础设施

- [ ] Task 2.1: 创建配置文件 `src/config/index.js`
- [ ] Task 2.2: 创建 MongoDB 数据模型（9个模型）
  - [ ] SubTask 2.2.1: 创建 User 模型
  - [ ] SubTask 2.2.2: 创建 Role 模型
  - [ ] SubTask 2.2.3: 创建 Menu 模型
  - [ ] SubTask 2.2.4: 创建 Organization 模型
  - [ ] SubTask 2.2.5: 创建 Dictionary 和 DictionaryItem 模型
  - [ ] SubTask 2.2.6: 创建 File 模型
  - [ ] SubTask 2.2.7: 创建 LoginLog 模型
  - [ ] SubTask 2.2.8: 创建 OperationLog 模型

- [ ] Task 2.3: 创建工具函数
  - [ ] SubTask 2.3.1: 创建统一响应工具 `src/utils/response.js`
  - [ ] SubTask 2.3.2: 创建 JWT 工具 `src/utils/jwt.js`
  - [ ] SubTask 2.3.3: 创建密码加密工具 `src/utils/password.js`

- [ ] Task 2.4: 创建中间件
  - [ ] SubTask 2.4.1: 创建错误处理中间件 `src/middlewares/error.middleware.js`
  - [ ] SubTask 2.4.2: 创建日志中间件 `src/middlewares/logger.middleware.js`
  - [ ] SubTask 2.4.3: 创建 JWT 认证中间件 `src/middlewares/auth.middleware.js`

## 核心业务实现

- [ ] Task 3.1: 实现认证模块 `src/routes/auth.routes.js`
  - [ ] SubTask 3.1.1: 实现登录接口 POST /api/v1/auth/login
  - [ ] SubTask 3.1.2: 实现登出接口 POST /api/v1/auth/logout
  - [ ] SubTask 3.1.3: 实现获取当前用户接口 GET /api/v1/auth/current-user
  - [ ] SubTask 3.1.4: 实现刷新 Token 接口 POST /api/v1/auth/refresh

- [ ] Task 3.2: 实现用户管理模块 `src/routes/user.routes.js`
  - [ ] SubTask 3.2.1: 实现用户列表接口 GET /api/v1/users
  - [ ] SubTask 3.2.2: 实现获取单个用户接口 GET /api/v1/users/:id
  - [ ] SubTask 3.2.3: 实现创建用户接口 POST /api/v1/users
  - [ ] SubTask 3.2.4: 实现更新用户接口 PUT /api/v1/users/:id
  - [ ] SubTask 3.2.5: 实现删除用户接口 DELETE /api/v1/users/:id
  - [ ] SubTask 3.2.6: 实现修改用户状态接口 PUT /api/v1/users/:id/status
  - [ ] SubTask 3.2.7: 实现修改密码接口 PUT /api/v1/users/:id/password

- [ ] Task 3.3: 实现角色管理模块 `src/routes/role.routes.js`
  - [ ] SubTask 3.3.1: 实现角色列表接口 GET /api/v1/roles
  - [ ] SubTask 3.3.2: 实现获取单个角色接口 GET /api/v1/roles/:id
  - [ ] SubTask 3.3.3: 实现创建角色接口 POST /api/v1/roles
  - [ ] SubTask 3.3.4: 实现更新角色接口 PUT /api/v1/roles/:id
  - [ ] SubTask 3.3.5: 实现删除角色接口 DELETE /api/v1/roles/:id
  - [ ] SubTask 3.3.6: 实现更新角色权限接口 PUT /api/v1/roles/:id/permissions

- [ ] Task 3.4: 实现菜单管理模块 `src/routes/menu.routes.js`
  - [ ] SubTask 3.4.1: 实现获取菜单树形列表接口 GET /api/v1/menus
  - [ ] SubTask 3.4.2: 实现获取单个菜单接口 GET /api/v1/menus/:id
  - [ ] SubTask 3.4.3: 实现创建菜单接口 POST /api/v1/menus
  - [ ] SubTask 3.4.4: 实现更新菜单接口 PUT /api/v1/menus/:id
  - [ ] SubTask 3.4.5: 实现删除菜单接口 DELETE /api/v1/menus/:id

- [ ] Task 3.5: 实现机构管理模块 `src/routes/organization.routes.js`
  - [ ] SubTask 3.5.1: 实现获取机构树形列表接口 GET /api/v1/organizations
  - [ ] SubTask 3.5.2: 实现获取单个机构接口 GET /api/v1/organizations/:id
  - [ ] SubTask 3.5.3: 实现创建机构接口 POST /api/v1/organizations
  - [ ] SubTask 3.5.4: 实现更新机构接口 PUT /api/v1/organizations/:id
  - [ ] SubTask 3.5.5: 实现删除机构接口 DELETE /api/v1/organizations/:id

- [ ] Task 3.6: 实现字典管理模块 `src/routes/dictionary.routes.js`
  - [ ] SubTask 3.6.1: 实现字典分类列表接口 GET /api/v1/dictionaries
  - [ ] SubTask 3.6.2: 实现获取字典项列表接口 GET /api/v1/dictionaries/:code/items
  - [ ] SubTask 3.6.3: 实现创建字典分类接口 POST /api/v1/dictionaries
  - [ ] SubTask 3.6.4: 实现更新字典分类接口 PUT /api/v1/dictionaries/:id
  - [ ] SubTask 3.6.5: 实现删除字典分类接口 DELETE /api/v1/dictionaries/:id
  - [ ] SubTask 3.6.6: 实现创建字典项接口 POST /api/v1/dictionaries/:code/items
  - [ ] SubTask 3.6.7: 实现更新字典项接口 PUT /api/v1/dictionaries/:code/items/:itemId
  - [ ] SubTask 3.6.8: 实现删除字典项接口 DELETE /api/v1/dictionaries/:code/items/:itemId

- [ ] Task 3.7: 实现文件管理模块 `src/routes/file.routes.js`
  - [ ] SubTask 3.7.1: 实现文件列表接口 GET /api/v1/files
  - [ ] SubTask 3.7.2: 实现获取文件信息接口 GET /api/v1/files/:id
  - [ ] SubTask 3.7.3: 实现文件上传接口 POST /api/v1/files/upload
  - [ ] SubTask 3.7.4: 实现删除文件接口 DELETE /api/v1/files/:id
  - [ ] SubTask 3.7.5: 实现文件下载接口 GET /api/v1/files/:id/download

- [ ] Task 3.8: 实现登录日志模块 `src/routes/log.routes.js`
  - [ ] SubTask 3.8.1: 实现登录日志列表接口 GET /api/v1/login-logs
  - [ ] SubTask 3.8.2: 实现登录日志详情接口 GET /api/v1/login-logs/:id
  - [ ] SubTask 3.8.3: 实现清理登录日志接口 DELETE /api/v1/login-logs

- [ ] Task 3.9: 实现操作日志模块 `src/routes/log.routes.js`
  - [ ] SubTask 3.9.1: 实现操作日志列表接口 GET /api/v1/operation-logs
  - [ ] SubTask 3.9.2: 实现操作日志详情接口 GET /api/v1/operation-logs/:id
  - [ ] SubTask 3.9.3: 实现清理操作日志接口 DELETE /api/v1/operation-logs

## 应用入口与路由汇总

- [ ] Task 4.1: 创建路由汇总文件 `src/routes/index.js`
- [ ] Task 4.2: 创建 Express 应用入口 `src/app.js`

## 数据初始化

- [ ] Task 5.1: 创建数据初始化脚本 `src/scripts/init-data.js`
  - [ ] SubTask 5.1.1: 创建默认管理员账户（admin/admin123）
  - [ ] SubTask 5.1.2: 创建默认角色（管理员、普通用户、游客）
  - [ ] SubTask 5.1.3: 创建基础菜单结构（系统管理模块相关菜单）
  - [ ] SubTask 5.1.4: 创建基础字典数据（性别、机构类型、状态）

## 测试验证

- [ ] Task 6.1: 编写接口测试验证文档
- [ ] Task 6.2: 验证 Docker 部署流程

## Task Dependencies

- Task 1.2 依赖 Task 1.1
- Task 2.3 依赖 Task 2.1
- Task 2.4 依赖 Task 2.3
- Task 3.1 依赖 Task 2.1, 2.2, 2.3, 2.4
- Task 3.2 - 3.9 依赖 Task 2.1, 2.2, 2.3, 2.4
- Task 4.1 依赖 Task 3.1 - 3.9
- Task 4.2 依赖 Task 4.1
- Task 5.1 依赖 Task 4.2
- Task 6.1 依赖 Task 4.2, 5.1
