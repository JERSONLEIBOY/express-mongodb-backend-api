# OpenAPI 文档使用指南

## 📚 概述

本项目已经成功集成了 OpenAPI 3.0 文档生成功能，使用 JSDoc 注解和 swagger-jsdoc 库。

## 🚀 快速开始

### 1. 启动服务器

```bash
# 开发模式启动
npm run dev

# 生产模式启动
npm start
```

### 2. 访问 OpenAPI 文档

打开浏览器访问：`http://localhost:3000/api-docs/`

## 📖 文档功能

### Swagger UI 特性

- **交互式 API 文档**：可以直接在文档页面测试 API 端点
- **实时预览**：修改代码后，Swagger UI 会自动更新
- **认证支持**：点击右上角 "Authorize" 按钮，输入 JWT token
- **请求示例**：自动生成请求示例，方便测试

### 已实现的端点模块（共 28 个路径）

1. **认证模块** (`/api/v1/auth`) — 5 个端点
   - POST /login、POST /logout、GET /current-user、POST /refresh

2. **用户管理** (`/api/v1/users`) — 7 个端点
   - CRUD + PUT /:id/status、PUT /:id/password

3. **角色管理** (`/api/v1/roles`) — 6 个端点
   - CRUD + PUT /:id/permissions、PUT /:id/status

4. **菜单管理** (`/api/v1/menus`) — 5 个端点
   - CRUD + GET /（树形结构）

5. **组织管理** (`/api/v1/organizations`) — 5 个端点
   - CRUD + GET /（树形结构）

6. **字典管理** (`/api/v1/dictionaries`) — 8 个端点
   - 字典 CRUD + 字典项 CRUD（注解位于 `dictionary.controller.js`）

7. **文件管理** (`/api/v1/files`) — 5 个端点
   - GET /、GET /:id、POST /upload（multipart）、DELETE /:id、GET /:id/download

8. **日志管理** (`/api/v1/logs`) — 6 个端点
   - GET /login-logs、GET /login-logs/:id、DELETE /login-logs
   - GET /operation-logs、GET /operation-logs/:id、DELETE /operation-logs

> **注意**：字典、文件、日志模块的注解写在各自的 controller 文件中，swagger 配置已同时扫描 `src/routes/*.js` 和 `src/controllers/*.js`。

## 🔧 自定义配置

### 修改 OpenAPI 配置

编辑 `src/config/swagger.js` 文件：

```javascript
// 修改服务器信息
const options = {
  definition: {
    info: {
      title: '你的 API 名称',
      version: '1.0.0',
      description: 'API 描述'
    },
    servers: [
      {
        url: 'http://your-domain.com',
        description: '生产服务器'
      }
    ]
  }
};
```

### 添加新的端点文档

1. 在控制器方法上方添加 JSDoc 注解：
```javascript
/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags: [Users]
 *     summary: 获取用户列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: 页码
 *     responses:
 *       200:
 *         description: 成功获取用户列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 */
```

2. Swagger UI 会自动扫描所有路由文件中的注解

## 🛠️ 开发建议

### 1. 使用 JSDoc 注解的最佳实践

- 为每个端点提供清晰的描述
- 标注请求参数类型和必需性
- 定义可能的响应状态码
- 使用 `$ref` 引用已定义的 schema

### 2. Schema 管理

- 在 `src/config/swagger.js` 中定义基础 schema
- 避免在注解中重复定义相同的对象
- 使用继承（allOf）来组合 schema

### 3. 测试流程

1. 添加新的端点注解
2. 重启服务器
3. 访问 `/api-docs/` 检查文档
4. 在 Swagger UI 中测试端点

## 📝 示例：如何为新模块添加文档

以添加角色管理为例：

1. **在 role.controller.js 中添加注解**
```javascript
/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     tags: [Roles]
 *     summary: 获取角色列表
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取角色列表
 */
const getRoles = async (req, res, next) => {
  // ...
};
```

2. **在 role.routes.js 中添加注解**
```javascript
/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     tags: [Roles]
 *     summary: 获取角色列表
 *     responses:
 *       200:
 *         description: 成功获取角色列表
 */
router.get('/', getRoles);
```

## 🔍 常见问题

### Q: Swagger UI 显示 "No operations defined"？
A: 检查路由文件中的 JSDoc 注解格式是否正确。

### Q: 如何自定义 Swagger UI 的样式？
A: 在 `src/config/swagger.js` 中配置 UI 选项：
```javascript
const options = {
  // ... 其他配置
  customCss: '.swagger-ui .topbar { display: none }'
};
```

### Q: 是否支持导出 OpenAPI 规范文件？
A: 可以通过以下方式导出：
```javascript
const fs = require('fs');
const YAML = require('yaml');

const yamlString = YAML.stringify(specs);
fs.writeFileSync('openapi.yaml', yamlString);
```

## 📞 支持

如果遇到问题，请检查：
1. JSDoc 注解格式是否正确
2. 依赖包是否正确安装
3. 服务器是否成功启动
4. 网络请求是否正常

---

**提示**：本指南会随着项目的更新而持续完善。如有问题，请查看项目代码或提交 issue。