const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// OpenAPI 3.0 配置
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
        url: process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`,
        description: '当前服务器'
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

        // 错误响应
        Error: {
          type: 'object',
          properties: {
            code: {
              type: 'integer',
              examples: {
                400: { value: 400, description: '请求参数错误' },
                401: { value: 401, description: '未授权，请登录' },
                403: { value: 403, description: '权限不足' },
                404: { value: 404, description: '资源不存在' },
                500: { value: 500, description: '服务器内部错误' }
              }
            },
            message: {
              type: 'string',
              description: '错误信息'
            }
          }
        },

        // 用户模型
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              example: '60d5f8f7a7b3d2b3d4e5f6b7',
              description: '用户 ID'
            },
            username: {
              type: 'string',
              example: 'admin',
              description: '用户名'
            },
            name: {
              type: 'string',
              example: '管理员',
              description: '姓名'
            },
            sex: {
              type: 'string',
              enum: ['male', 'female', 'unknown'],
              example: 'male',
              description: '性别'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@example.com',
              description: '邮箱'
            },
            phone: {
              type: 'string',
              example: '13800138000',
              description: '手机号'
            },
            birthday: {
              type: 'string',
              format: 'date',
              example: '1990-01-01',
              description: '生日'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'locked'],
              example: 'active',
              description: '状态'
            },
            remark: {
              type: 'string',
              example: '备注信息',
              description: '备注'
            },
            organization: {
              $ref: '#/components/schemas/Organization'
            },
            roles: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Role'
              },
              description: '角色列表'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z',
              description: '创建时间'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z',
              description: '更新时间'
            }
          }
        },

        // 角色模型
        Role: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              example: '60d5f8f7a7b3d2b3d4e5f6b8',
              description: '角色 ID'
            },
            name: {
              type: 'string',
              example: '管理员',
              description: '角色名称'
            },
            code: {
              type: 'string',
              example: 'ADMIN',
              description: '角色代码'
            },
            remark: {
              type: 'string',
              example: '系统管理员',
              description: '备注'
            },
            permissions: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Menu'
              },
              description: '权限列表'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              example: 'active',
              description: '状态'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z',
              description: '创建时间'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z',
              description: '更新时间'
            }
          }
        },

        // 菜单模型
        Menu: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              example: '60d5f8f7a7b3d2b3d4e5f6b9',
              description: '菜单 ID'
            },
            name: {
              type: 'string',
              example: '用户管理',
              description: '菜单名称'
            },
            type: {
              type: 'string',
              enum: ['directory', 'menu', 'external'],
              example: 'menu',
              description: '菜单类型'
            },
            path: {
              type: 'string',
              example: '/user',
              description: '路径'
            },
            parentId: {
              type: 'string',
              format: 'ObjectId',
              example: null,
              description: '父菜单 ID'
            },
            children: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Menu'
              },
              description: '子菜单'
            },
            sort: {
              type: 'integer',
              example: 0,
              description: '排序'
            },
            icon: {
              type: 'string',
              example: 'user',
              description: '图标'
            },
            visible: {
              type: 'boolean',
              example: true,
              description: '是否可见'
            },
            component: {
              type: 'string',
              example: 'UserManagement',
              description: '组件'
            },
            redirect: {
              type: 'string',
              example: null,
              description: '重定向'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z',
              description: '创建时间'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z',
              description: '更新时间'
            }
          }
        },

        // 组织模型
        Organization: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              example: '60d5f8f7a7b3d2b3d4e5f6ba',
              description: '组织 ID'
            },
            name: {
              type: 'string',
              example: '技术部',
              description: '组织名称'
            },
            type: {
              type: 'string',
              enum: ['company', 'department', 'team'],
              example: 'department',
              description: '组织类型'
            },
            parentId: {
              type: 'string',
              format: 'ObjectId',
              example: null,
              description: '父组织 ID'
            },
            sort: {
              type: 'integer',
              example: 0,
              description: '排序'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z',
              description: '创建时间'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z',
              description: '更新时间'
            }
          }
        },

        // 字典模型
        Dictionary: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              example: '60d5f8f7a7b3d2b3d4e5f6bb',
              description: '字典 ID'
            },
            name: {
              type: 'string',
              example: '性别',
              description: '字典名称'
            },
            code: {
              type: 'string',
              example: 'gender',
              description: '字典代码'
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/DictionaryItem'
              },
              description: '字典项列表'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              example: 'active',
              description: '状态'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z',
              description: '创建时间'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z',
              description: '更新时间'
            }
          }
        },

        // 字典项模型
        DictionaryItem: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              example: '60d5f8f7a7b3d2b3d4e5f6bc',
              description: '字典项 ID'
            },
            label: {
              type: 'string',
              example: '男',
              description: '标签'
            },
            value: {
              type: 'string',
              example: 'male',
              description: '值'
            },
            sort: {
              type: 'integer',
              example: 0,
              description: '排序'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z',
              description: '创建时间'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z',
              description: '更新时间'
            }
          }
        },

        // 文件模型
        File: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              example: '60d5f8f7a7b3d2b3d4e5f6bd',
              description: '文件 ID'
            },
            name: {
              type: 'string',
              example: 'document.pdf',
              description: '文件名'
            },
            path: {
              type: 'string',
              example: 'uploads/2023/01/01/document.pdf',
              description: '文件路径'
            },
            size: {
              type: 'integer',
              example: 1024000,
              description: '文件大小（字节）'
            },
            mimeType: {
              type: 'string',
              example: 'application/pdf',
              description: 'MIME 类型'
            },
            uploader: {
              type: 'string',
              format: 'ObjectId',
              example: '60d5f8f7a7b3d2b3d4e5f6b7',
              description: '上传者 ID'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z',
              description: '创建时间'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z',
              description: '更新时间'
            }
          }
        },

        // 登录日志模型
        LoginLog: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              example: '60d5f8f7a7b3d2b3d4e5f6be',
              description: '日志 ID'
            },
            username: {
              type: 'string',
              example: 'admin',
              description: '用户名'
            },
            loginType: {
              type: 'string',
              enum: ['login_success', 'login_fail', 'refresh_token'],
              example: 'login_success',
              description: '登录类型'
            },
            status: {
              type: 'string',
              enum: ['success', 'fail'],
              example: 'success',
              description: '状态'
            },
            ip: {
              type: 'string',
              example: '192.168.1.1',
              description: 'IP 地址'
            },
            device: {
              type: 'string',
              example: 'Chrome/Windows',
              description: '设备信息'
            },
            browser: {
              type: 'string',
              example: 'Chrome 91',
              description: '浏览器'
            },
            userAgent: {
              type: 'string',
              example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
              description: 'User Agent'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z',
              description: '创建时间'
            }
          }
        },

        // 操作日志模型
        OperationLog: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              example: '60d5f8f7a7b3d2b3d4e5f6bf',
              description: '日志 ID'
            },
            module: {
              type: 'string',
              example: 'User',
              description: '模块'
            },
            function: {
              type: 'string',
              example: 'updateUser',
              description: '功能'
            },
            url: {
              type: 'string',
              example: '/api/v1/users/123',
              description: '请求 URL'
            },
            method: {
              type: 'string',
              enum: ['GET', 'POST', 'PUT', 'DELETE'],
              example: 'PUT',
              description: 'HTTP 方法'
            },
            data: {
              type: 'object',
              description: '请求数据'
            },
            operator: {
              type: 'string',
              example: 'admin',
              description: '操作者'
            },
            duration: {
              type: 'number',
              example: 120.5,
              description: '耗时（毫秒）'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z',
              description: '创建时间'
            }
          }
        },

        // 登录请求
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 50,
              example: 'admin',
              description: '用户名'
            },
            password: {
              type: 'string',
              minLength: 6,
              example: '123456',
              description: '密码'
            }
          }
        },

        // 登录响应
        LoginResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              description: 'JWT Token'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        },

        // 创建用户请求
        CreateUserRequest: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 50,
              description: '用户名'
            },
            name: {
              type: 'string',
              maxLength: 50,
              description: '姓名'
            },
            sex: {
              type: 'string',
              enum: ['male', 'female', 'unknown'],
              description: '性别'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '邮箱'
            },
            phone: {
              type: 'string',
              description: '手机号'
            },
            birthday: {
              type: 'string',
              format: 'date',
              description: '生日'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: '密码'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'locked'],
              description: '状态'
            },
            remark: {
              type: 'string',
              maxLength: 500,
              description: '备注'
            },
            organization: {
              type: 'string',
              format: 'ObjectId',
              description: '组织 ID'
            },
            roles: {
              type: 'array',
              items: {
                type: 'string',
                format: 'ObjectId'
              },
              description: '角色 ID 列表'
            }
          }
        },

        // 更新用户请求
        UpdateUserRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              maxLength: 50,
              description: '姓名'
            },
            sex: {
              type: 'string',
              enum: ['male', 'female', 'unknown'],
              description: '性别'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '邮箱'
            },
            phone: {
              type: 'string',
              description: '手机号'
            },
            birthday: {
              type: 'string',
              format: 'date',
              description: '生日'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'locked'],
              description: '状态'
            },
            remark: {
              type: 'string',
              maxLength: 500,
              description: '备注'
            },
            organization: {
              type: 'string',
              format: 'ObjectId',
              description: '组织 ID'
            },
            roles: {
              type: 'array',
              items: {
                type: 'string',
                format: 'ObjectId'
              },
              description: '角色 ID 列表'
            }
          }
        },

        // 创建角色请求
        CreateRoleRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              maxLength: 50,
              description: '角色名称'
            },
            code: {
              type: 'string',
              description: '角色代码（大写）'
            },
            remark: {
              type: 'string',
              maxLength: 500,
              description: '备注'
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string',
                format: 'ObjectId'
              },
              description: '权限 ID 列表'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: '认证相关接口'
      },
      {
        name: 'Users',
        description: '用户管理接口'
      },
      {
        name: 'Roles',
        description: '角色管理接口'
      },
      {
        name: 'Menus',
        description: '菜单管理接口'
      },
      {
        name: 'Organizations',
        description: '组织管理接口'
      },
      {
        name: 'Dictionaries',
        description: '字典管理接口'
      },
      {
        name: 'Files',
        description: '文件管理接口'
      },
      {
        name: 'Logs',
        description: '日志管理接口'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'] // 扫描路由文件与控制器文件中的 JSDoc 注解
};

// 生成 OpenAPI 规范
const specs = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  specs
};