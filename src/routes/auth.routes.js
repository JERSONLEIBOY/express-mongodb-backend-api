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
      { method: 'GET', path: '/api/v1/auth/captcha', description: '获取图形验证码' },
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
/**
 * @swagger
 * /api/v1/auth/captcha:
 *   get:
 *     tags: [Authentication]
 *     summary: 获取图形验证码
 *     description: 返回 SVG 验证码图片（base64）和 captchaId，登录时需携带
 *     responses:
 *       200:
 *         description: 获取成功
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
 *                         captchaId:
 *                           type: string
 *                           description: 验证码 ID，登录时传入
 *                         base64:
 *                           type: string
 *                           description: SVG 图片 base64 数据
 */
router.get('/captcha', authController.getCaptcha);

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *         - captchaId
 *         - captchaCode
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
 *         captchaId:
 *           type: string
 *           description: 从 /captcha 接口获取的验证码 ID
 *         captchaCode:
 *           type: string
 *           description: 用户输入的验证码
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
 *     description: 获取当前登录用户的个人信息、角色列表、菜单/权限列表。ADMIN 角色用户的 authorities 返回数据库中全部菜单。
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
 *                       type: object
 *                       properties:
 *                         userId:           { type: string }
 *                         username:         { type: string }
 *                         nickname:         { type: string }
 *                         avatar:           { type: string }
 *                         sex:              { type: string }
 *                         sexName:          { type: string }
 *                         phone:            { type: string }
 *                         email:            { type: string }
 *                         birthday:         { type: string, nullable: true }
 *                         introduction:     { type: string }
 *                         organizationId:   { type: string }
 *                         organizationName: { type: string }
 *                         status:           { type: integer, enum: [0, 1] }
 *                         address:          { type: string }
 *                         tellPre:          { type: string }
 *                         tell:             { type: string }
 *                         createTime:       { type: string, example: '2026-05-15 14:40:28' }
 *                         roles:
 *                           type: array
 *                           description: 格式同 /api/v1/roles/page
 *                           items:
 *                             type: object
 *                             properties:
 *                               roleId:     { type: string }
 *                               roleCode:   { type: string }
 *                               roleName:   { type: string }
 *                               comments:   { type: string, nullable: true }
 *                               createTime: { type: string }
 *                         authorities:
 *                           type: array
 *                           description: 用户拥有的菜单，格式同 /api/v1/roles/{id}/menus
 *                           items:
 *                             type: object
 *                             properties:
 *                               menuId:     { type: string }
 *                               parentId:   { type: string }
 *                               title:      { type: string }
 *                               path:       { type: string, nullable: true }
 *                               component:  { type: string, nullable: true }
 *                               menuType:   { type: integer }
 *                               sortNumber: { type: integer }
 *                               authority:  { type: string, nullable: true }
 *                               icon:       { type: string, nullable: true }
 *                               hide:       { type: integer }
 *                               meta:       { type: string, nullable: true }
 *                               openType:   { type: integer, nullable: true }
 *                               createTime: { type: string }
 *                               updateTime: { type: string }
 *                               children:   { type: object, nullable: true }
 *                               checked:    { type: integer, nullable: true }
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
