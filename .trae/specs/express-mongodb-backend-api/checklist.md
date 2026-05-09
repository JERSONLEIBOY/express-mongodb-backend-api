# Express + MongoDB 后台管理后端接口检查清单

## 项目初始化

- [ ] package.json 包含所有必需依赖（express, mongoose, jsonwebtoken, bcryptjs, winston, morgan, multer, dotenv, cors, helmet）
- [ ] 目录结构符合规范要求
- [ ] .env.example 包含所有环境变量配置项
- [ ] pm2.config.js 配置正确
- [ ] Dockerfile 构建成功
- [ ] docker-compose.yml 配置正确（MongoDB + Node.js App）

## 配置文件

- [ ] src/config/index.js 导出数据库连接配置、JWT 配置、服务器配置

## 数据模型

- [ ] User 模型包含所有字段（username, name, sex, email, phone, birthday, password, status, remark, organization, roles）
- [ ] Role 模型包含所有字段（name, code, remark, permissions, status）
- [ ] Menu 模型包含所有字段（name, type, path, parentId, sort, icon, visible, component, redirect）
- [ ] Organization 模型包含所有字段（name, type, parentId, sort, status）
- [ ] Dictionary 模型包含所有字段（name, code, status）
- [ ] DictionaryItem 模型包含所有字段（dictionaryCode, label, value, sort, status）
- [ ] File 模型包含所有字段（name, path, size, mimeType, uploader, uploadTime）
- [ ] LoginLog 模型包含所有字段（username, loginTime, ip, device, os, browser, loginType, status）
- [ ] OperationLog 模型包含所有字段（module, function, url, method, params, data, duration, status, operator, operationTime）

## 工具函数

- [ ] src/utils/response.js 统一响应格式正确 { code, message, data }
- [ ] src/utils/jwt.js 生成和验证 JWT Token 功能正常
- [ ] src/utils/password.js 密码加密和验证功能正常

## 中间件

- [ ] src/middlewares/error.middleware.js 错误处理中间件正确处理 400/401/403/404/500 错误
- [ ] src/middlewares/logger.middleware.js 操作日志中间件正确记录操作
- [ ] src/middlewares/auth.middleware.js JWT 认证中间件正确验证 Token 和提取用户信息

## 认证模块接口

- [ ] POST /api/v1/auth/login 登录成功返回 token 和用户信息
- [ ] POST /api/v1/auth/logout 登出成功
- [ ] GET /api/v1/auth/current-user 返回当前用户信息和权限
- [ ] POST /api/v1/auth/refresh 刷新 Token 成功

## 用户管理模块接口

- [ ] GET /api/v1/users 分页查询用户列表成功
- [ ] GET /api/v1/users/:id 获取单个用户成功
- [ ] POST /api/v1/users 创建用户成功
- [ ] PUT /api/v1/users/:id 更新用户成功
- [ ] DELETE /api/v1/users/:id 删除用户成功
- [ ] PUT /api/v1/users/:id/status 修改用户状态成功
- [ ] PUT /api/v1/users/:id/password 修改密码成功

## 角色管理模块接口

- [ ] GET /api/v1/roles 分页查询角色列表成功
- [ ] GET /api/v1/roles/:id 获取单个角色成功
- [ ] POST /api/v1/roles 创建角色成功
- [ ] PUT /api/v1/roles/:id 更新角色成功
- [ ] DELETE /api/v1/roles/:id 删除角色成功
- [ ] PUT /api/v1/roles/:id/permissions 更新角色权限成功

## 菜单管理模块接口

- [ ] GET /api/v1/menus 获取菜单树形列表成功
- [ ] GET /api/v1/menus/:id 获取单个菜单成功
- [ ] POST /api/v1/menus 创建菜单成功
- [ ] PUT /api/v1/menus/:id 更新菜单成功
- [ ] DELETE /api/v1/menus/:id 删除菜单成功

## 机构管理模块接口

- [ ] GET /api/v1/organizations 获取机构树形列表成功
- [ ] GET /api/v1/organizations/:id 获取单个机构成功
- [ ] POST /api/v1/organizations 创建机构成功
- [ ] PUT /api/v1/organizations/:id 更新机构成功
- [ ] DELETE /api/v1/organizations/:id 删除机构成功

## 字典管理模块接口

- [ ] GET /api/v1/dictionaries 获取字典分类列表成功
- [ ] GET /api/v1/dictionaries/:code/items 获取字典项列表成功
- [ ] POST /api/v1/dictionaries 创建字典分类成功
- [ ] PUT /api/v1/dictionaries/:id 更新字典分类成功
- [ ] DELETE /api/v1/dictionaries/:id 删除字典分类成功
- [ ] POST /api/v1/dictionaries/:code/items 创建字典项成功
- [ ] PUT /api/v1/dictionaries/:code/items/:itemId 更新字典项成功
- [ ] DELETE /api/v1/dictionaries/:code/items/:itemId 删除字典项成功

## 文件管理模块接口

- [ ] GET /api/v1/files 分页查询文件列表成功
- [ ] GET /api/v1/files/:id 获取文件信息成功
- [ ] POST /api/v1/files/upload 文件上传成功
- [ ] DELETE /api/v1/files/:id 删除文件成功
- [ ] GET /api/v1/files/:id/download 文件下载成功

## 登录日志模块接口

- [ ] GET /api/v1/login-logs 分页查询登录日志成功
- [ ] GET /api/v1/login-logs/:id 获取登录日志详情成功
- [ ] DELETE /api/v1/login-logs 清理登录日志成功

## 操作日志模块接口

- [ ] GET /api/v1/operation-logs 分页查询操作日志成功
- [ ] GET /api/v1/operation-logs/:id 获取操作日志详情成功
- [ ] DELETE /api/v1/operation-logs 清理操作日志成功

## 应用入口

- [ ] src/app.js 正确配置 Express 中间件
- [ ] src/routes/index.js 正确汇总所有路由
- [ ] 数据库连接成功
- [ ] 服务器启动成功监听指定端口

## 数据初始化

- [ ] 默认管理员账户 admin/admin123 创建成功
- [ ] 默认角色（管理员、普通用户、游客）创建成功
- [ ] 基础菜单结构创建成功
- [ ] 基础字典数据（性别、机构类型、状态）创建成功

## Docker 部署

- [ ] Docker 镜像构建成功
- [ ] docker-compose up -d 启动成功
- [ ] MongoDB 容器正常运行
- [ ] Node.js App 容器正常运行
- [ ] PM2 进程管理正常工作
- [ ] 日志输出正常

## 整体验证

- [ ] 所有接口返回统一响应格式 { code, message, data }
- [ ] JWT Token 认证正常工作
- [ ] 错误处理正确返回相应状态码
- [ ] 日志记录完整
- [ ] 文件上传下载正常
