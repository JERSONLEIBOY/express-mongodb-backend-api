const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// 简化的 OpenAPI 配置
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express MongoDB Backend API',
      version: '1.0.0',
      description: 'Express + MongoDB 后台管理后端接口文档',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: '开发服务器'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Token 格式：Authorization: Bearer <token>'
        }
      },
      schemas: {
        // 标准响应格式
        StandardResponse: {
          type: 'object',
          properties: {
            code: {
              type: 'integer',
              example: 200,
              description: 'HTTP 状态码'
            },
            message: {
              type: 'string',
              example: '操作成功',
              description: '响应消息'
            },
            data: {
              type: 'object',
              nullable: true,
              description: '响应数据'
            }
          }
        },

        // 分页信息
        Pagination: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              example: 100,
              description: '总记录数'
            },
            page: {
              type: 'integer',
              example: 1,
              description: '当前页码'
            },
            pageSize: {
              type: 'integer',
              example: 20,
              description: '每页记录数'
            },
            totalPages: {
              type: 'integer',
              example: 5,
              description: '总页数'
            }
          }
        },

        // 用户模型（简化版）
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', format: 'ObjectId', description: '用户 ID' },
            username: { type: 'string', description: '用户名' },
            name: { type: 'string', description: '姓名' },
            email: { type: 'string', format: 'email', description: '邮箱' },
            status: { type: 'string', enum: ['active', 'inactive', 'locked'], description: '状态' },
            roles: { type: 'array', items: { type: 'object' }, description: '角色列表' },
            createdAt: { type: 'string', format: 'date-time', description: '创建时间' }
          }
        },

        // 登录请求
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', example: 'admin', description: '用户名' },
            password: { type: 'string', example: '123456', description: '密码' }
          }
        },

        // 登录响应
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'JWT Token' },
            user: { $ref: '#/components/schemas/User' }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: '认证相关接口' },
      { name: 'Users', description: '用户管理接口' }
    ]
  },
  apis: ['./src/routes/*.js']
};

// 生成 OpenAPI 规范
const specs = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  specs
};