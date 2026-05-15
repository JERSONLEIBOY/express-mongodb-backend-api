# 项目规则

## 接口文档同步（强制）

每次新增或修改接口后，必须同步完成以下两项，缺一不可：

1. **Swagger 注释** — 在路由文件（`src/routes/*.routes.js`）的路由定义上方添加 `@swagger` JSDoc 注释，包含 `tags`、`summary`、`requestBody`（如有）、`responses`。

2. **路由列表** — 在同文件 `GET /` 路由返回的 `endpoints` 数组中添加对应条目。

> 背景：新增验证码接口（`GET /api/v1/auth/captcha`）时遗漏了文档，需用户二次提醒才补充。

## 接口自测（强制）

每次新增或修改接口后，必须自己调用接口验证通过后，才能反馈给用户。

> 背景：修改菜单接口后未自测，`GET /api/v1/menus` 缺少 `authenticate` 中间件导致 401，需用户反馈才发现。
