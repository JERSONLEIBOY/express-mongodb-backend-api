const LoginLog = require('../models/LoginLog');
const OperationLog = require('../models/OperationLog');
const response = require('../utils/response');

/**
 * @swagger
 * tags:
 *   name: Logs
 *   description: 日志管理接口
 */

/**
 * @swagger
 * /api/v1/logs/login-logs:
 *   get:
 *     tags: [Logs]
 *     summary: 获取登录日志列表
 *     description: 分页获取登录日志，支持按用户名、登录类型、状态、时间范围过滤
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: 每页记录数（最大 100）
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         description: 用户名模糊搜索
 *       - in: query
 *         name: loginType
 *         schema:
 *           type: string
 *           enum: [login_success, login_fail, refresh_token]
 *         description: 登录类型
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, fail]
 *         description: 登录结果
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 起始时间（ISO 8601）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 结束时间（ISO 8601）
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           default: loginTime
 *           enum: [loginTime, username, status, createdAt]
 *         description: 排序字段
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           default: desc
 *           enum: [asc, desc]
 *         description: 排序方式
 *     responses:
 *       200:
 *         description: 成功获取登录日志列表
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
 *                         list:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/LoginLog'
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const getLoginLogs = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, username, loginType, status, startDate, endDate, sortField = 'loginTime', sortOrder = 'desc' } = req.query;

    const query = {};

    if (username) query.username = new RegExp(username, 'i');
    if (loginType) query.loginType = loginType;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.loginTime = {};
      if (startDate) query.loginTime.$gte = new Date(startDate);
      if (endDate) query.loginTime.$lte = new Date(endDate);
    }

    const limit = Math.min(parseInt(pageSize, 10) || 20, 100);
    const skip = (parseInt(page, 10) - 1) * limit;

    const sortObj = {};
    sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;

    const [list, total] = await Promise.all([
      LoginLog.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      LoginLog.countDocuments(query)
    ]);

    return response.paginated(res, { list, total, page, pageSize });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/logs/login-logs/{id}:
 *   get:
 *     tags: [Logs]
 *     summary: 获取单条登录日志
 *     description: 根据 ID 获取登录日志详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 日志 ID
 *     responses:
 *       200:
 *         description: 成功获取登录日志详情
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/LoginLog'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const getLoginLogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const log = await LoginLog.findById(id).lean();

    if (!log) {
      return response.notFound(res, '登录日志不存在');
    }

    return response.success(res, log);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/logs/login-logs:
 *   delete:
 *     tags: [Logs]
 *     summary: 清理登录日志
 *     description: 根据时间范围批量删除登录日志，未指定范围将清空所有日志。仅限管理员操作。
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: 起始时间（包含）
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: 结束时间（包含）
 *     responses:
 *       200:
 *         description: 清理成功
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
 *                         deletedCount:
 *                           type: integer
 *                           example: 100
 *                           description: 被删除的日志条数
 *                     message:
 *                       type: string
 *                       example: '清理成功'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const clearLoginLogs = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;

    const query = {};
    if (startDate || endDate) {
      query.loginTime = {};
      if (startDate) query.loginTime.$gte = new Date(startDate);
      if (endDate) query.loginTime.$lte = new Date(endDate);
    }

    const result = await LoginLog.deleteMany(query);

    return response.success(res, { deletedCount: result.deletedCount }, '清理成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/logs/operation-logs:
 *   get:
 *     tags: [Logs]
 *     summary: 获取操作日志列表
 *     description: 分页获取操作日志，支持按模块、操作人、状态、时间范围过滤
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: 每页记录数（最大 100）
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *         description: 模块名模糊搜索
 *       - in: query
 *         name: operator
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 操作人用户 ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, fail]
 *         description: 操作结果
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 起始时间（ISO 8601）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 结束时间（ISO 8601）
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           default: operationTime
 *           enum: [operationTime, module, status, createdAt]
 *         description: 排序字段
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           default: desc
 *           enum: [asc, desc]
 *         description: 排序方式
 *     responses:
 *       200:
 *         description: 成功获取操作日志列表
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
 *                         list:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/OperationLog'
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const getOperationLogs = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, module, operator, status, startDate, endDate, sortField = 'operationTime', sortOrder = 'desc' } = req.query;

    const query = {};

    if (module) query.module = new RegExp(module, 'i');
    if (operator) query.operator = operator;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.operationTime = {};
      if (startDate) query.operationTime.$gte = new Date(startDate);
      if (endDate) query.operationTime.$lte = new Date(endDate);
    }

    const limit = Math.min(parseInt(pageSize, 10) || 20, 100);
    const skip = (parseInt(page, 10) - 1) * limit;

    const sortObj = {};
    sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;

    const [list, total] = await Promise.all([
      OperationLog.find(query)
        .populate('operator', 'username name')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      OperationLog.countDocuments(query)
    ]);

    return response.paginated(res, { list, total, page, pageSize });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/logs/operation-logs/{id}:
 *   get:
 *     tags: [Logs]
 *     summary: 获取单条操作日志
 *     description: 根据 ID 获取操作日志详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 日志 ID
 *     responses:
 *       200:
 *         description: 成功获取操作日志详情
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/OperationLog'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const getOperationLogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const log = await OperationLog.findById(id)
      .populate('operator', 'username name')
      .lean();

    if (!log) {
      return response.notFound(res, '操作日志不存在');
    }

    return response.success(res, log);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/logs/operation-logs:
 *   delete:
 *     tags: [Logs]
 *     summary: 清理操作日志
 *     description: 根据时间范围批量删除操作日志，未指定范围将清空所有日志。仅限管理员操作。
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: 起始时间（包含）
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: 结束时间（包含）
 *     responses:
 *       200:
 *         description: 清理成功
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
 *                         deletedCount:
 *                           type: integer
 *                           example: 50
 *                           description: 被删除的日志条数
 *                     message:
 *                       type: string
 *                       example: '清理成功'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const clearOperationLogs = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;

    const query = {};
    if (startDate || endDate) {
      query.operationTime = {};
      if (startDate) query.operationTime.$gte = new Date(startDate);
      if (endDate) query.operationTime.$lte = new Date(endDate);
    }

    const result = await OperationLog.deleteMany(query);

    return response.success(res, { deletedCount: result.deletedCount }, '清理成功');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLoginLogs,
  getLoginLogById,
  clearLoginLogs,
  getOperationLogs,
  getOperationLogById,
  clearOperationLogs
};
