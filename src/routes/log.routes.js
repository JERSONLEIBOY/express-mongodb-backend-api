const express = require('express');
const router = express.Router();
const logController = require('../controllers/log.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

/**
 * @swagger
 * /api/v1/logs/login-logs/page:
 *   get:
 *     tags: [Logs]
 *     summary: 分页查询登录日志
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: username
 *         schema: { type: string }
 *       - in: query
 *         name: ip
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: integer, enum: [0, 1] }
 *       - in: query
 *         name: createTimeStart
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: createTimeEnd
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/login-logs/page', logController.getLoginLogsPage);

/**
 * @swagger
 * /api/v1/logs/login-logs:
 *   get:
 *     tags: [Logs]
 *     summary: 查询登录日志列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: username
 *         schema: { type: string }
 *       - in: query
 *         name: ip
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: integer, enum: [0, 1] }
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/login-logs', logController.getLoginLogs);

/**
 * @swagger
 * /api/v1/logs/login-logs:
 *   delete:
 *     tags: [Logs]
 *     summary: 清空登录日志
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
router.delete('/login-logs', authorize('ADMIN'), logController.clearLoginLogs);

/**
 * @swagger
 * /api/v1/logs/operation-logs/page:
 *   get:
 *     tags: [Logs]
 *     summary: 分页查询操作日志
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: username
 *         schema: { type: string }
 *       - in: query
 *         name: operation
 *         schema: { type: string }
 *       - in: query
 *         name: module
 *         schema: { type: string }
 *       - in: query
 *         name: createTimeStart
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: createTimeEnd
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/operation-logs/page', logController.getOperationLogsPage);

/**
 * @swagger
 * /api/v1/logs/operation-logs:
 *   get:
 *     tags: [Logs]
 *     summary: 查询操作日志列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: username
 *         schema: { type: string }
 *       - in: query
 *         name: operation
 *         schema: { type: string }
 *       - in: query
 *         name: module
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/operation-logs', logController.getOperationLogs);

/**
 * @swagger
 * /api/v1/logs/operation-logs:
 *   delete:
 *     tags: [Logs]
 *     summary: 清空操作日志
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
router.delete('/operation-logs', authorize('ADMIN'), logController.clearOperationLogs);

module.exports = router;