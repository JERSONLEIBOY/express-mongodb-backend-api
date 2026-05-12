const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { config } = require('../config');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { code: 429, message: '登录尝试过于频繁，请 15 分钟后再试', data: null },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.env !== 'production'
});

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: 认证相关接口
 */

/**
 * @swagger
 * /api/v1/auth:
 *   get:
 *     summary: 认证模块路由信息
 *     description: 显示认证模块可用的接口
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: 成功获取接口列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 endpoints:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       method:
 *                         type: string
 *                       path:
 *                         type: string
 *                       description:
 *                         type: string
 */

router.get('/', (req, res) => {
  res.json({
    message: '认证模块接口列表',
    endpoints: [
      { method: 'POST', path: '/api/v1/auth/login', description: '用户登录' },
      { method: 'POST', path: '/api/v1/auth/logout', description: '用户登出' },
      { method: 'GET', path: '/api/v1/auth/current-user', description: '获取当前用户信息' },
      { method: 'POST', path: '/api/v1/auth/refresh', description: '刷新 Token' }
    ]
  });
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: 用户登录
 *     description: 使用用户名和密码进行登录，登录成功返回 JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       429:
 *         description: 登录尝试过于频繁
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/login', loginLimiter, authController.login);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: 用户登出
 *     description: 用户登出接口
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /api/v1/auth/current-user:
 *   get:
 *     tags: [Authentication]
 *     summary: 获取当前用户信息
 *     description: 获取当前登录用户的详细信息，包括角色和权限
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取用户信息
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/current-user', authenticate, authController.getCurrentUser);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: 刷新 Token
 *     description: 使用当前 token 刷新获取新的 JWT token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 刷新成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         token:
 *                           type: string
 *                           description: 新的 JWT token
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/refresh', authenticate, authController.refreshToken);

module.exports = router;
