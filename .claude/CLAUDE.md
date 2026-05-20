# 项目规则

## 接口变更规范（强制）

每次新增或修改接口后，必须完成以下两项工作：

1. **Swagger 注释**：在路由文件（`src/routes/*.routes.js`）的路由定义上方添加 `@swagger` JSDoc 注释，包含 `tags`、`summary`、`requestBody`（如有）、`responses`

2. **路由列表更新**：在同文件 `GET /` 路由返回的 `endpoints` 数组中添加对应条目

3. **接口自测**：自行调用接口验证通过后，再反馈给用户