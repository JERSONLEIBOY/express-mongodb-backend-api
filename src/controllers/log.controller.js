const LoginLog = require('../models/LoginLog');
const OperationLog = require('../models/OperationLog');
const User = require('../models/User');
const response = require('../utils/response');

const formatLoginLog = (log, userMap) => ({
  id: String(log._id),
  username: log.username ?? '',
  os: log.os ?? '',
  device: log.device ?? '',
  browser: log.browser ?? '',
  ip: log.ip ?? '',
  location: log.location ?? '',
  loginType: log.loginType ?? 0,
  comments: log.comments ?? '',
  createTime: log.createdAt,
  nickname: log.nickname || (userMap?.get(log.username)?.nickname ?? '')
});

const formatOperationLog = (log, userMap) => {
  const u = log.userId && typeof log.userId === 'object'
    ? log.userId
    : (userMap?.get(String(log.userId)) || null);
  return {
    id: String(log._id),
    userId: u?._id ? String(u._id) : (log.userId ? String(log.userId) : null),
    username: u?.username ?? '',
    nickname: u?.nickname ?? '',
    traceId: log.traceId ?? '',
    module: log.module ?? '',
    businessType: log.businessType ?? 'OTHER',
    description: log.description ?? '',
    url: log.url ?? '',
    requestMethod: log.requestMethod ?? '',
    method: log.method ?? '',
    params: log.params ?? '',
    result: log.result ?? '',
    error: log.error ?? '',
    spendTime: log.spendTime ?? 0,
    os: log.os ?? '',
    device: log.device ?? '',
    browser: log.browser ?? '',
    ip: log.ip ?? '',
    location: log.location ?? '',
    status: log.status ?? 0,
    createTime: log.createdAt
  };
};

const buildLoginLogQuery = ({ username, nickname, loginType, createTimeStart, createTimeEnd }) => {
  const query = {};
  if (username) query.username = new RegExp(username, 'i');
  if (nickname) query.nickname = new RegExp(nickname, 'i');
  if (loginType !== undefined && loginType !== '') query.loginType = Number(loginType);
  if (createTimeStart || createTimeEnd) {
    query.createdAt = {};
    if (createTimeStart) query.createdAt.$gte = new Date(createTimeStart);
    if (createTimeEnd) query.createdAt.$lte = new Date(createTimeEnd);
  }
  return query;
};

const buildOperationLogQuery = async ({ username, module, status, createTimeStart, createTimeEnd }) => {
  const query = {};
  if (module) query.module = new RegExp(module, 'i');
  if (status !== undefined && status !== '') query.status = Number(status);
  if (createTimeStart || createTimeEnd) {
    query.createdAt = {};
    if (createTimeStart) query.createdAt.$gte = new Date(createTimeStart);
    if (createTimeEnd) query.createdAt.$lte = new Date(createTimeEnd);
  }
  if (username) {
    const users = await User.find({ username: new RegExp(username, 'i') }, '_id').lean();
    query.userId = { $in: users.map(u => u._id) };
  }
  return query;
};

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
 *         description: 用户账号
 *       - in: query
 *         name: nickname
 *         schema: { type: string }
 *         description: 用户昵称
 *       - in: query
 *         name: loginType
 *         schema: { type: integer, enum: [0, 1, 2, 3] }
 *         description: 操作类型, 0登录成功, 1登录失败, 2退出登录, 3续签token
 *       - in: query
 *         name: createTimeStart
 *         schema: { type: string, format: date-time }
 *         description: 开始时间
 *       - in: query
 *         name: createTimeEnd
 *         schema: { type: string, format: date-time }
 *         description: 截止时间
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 list:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       username: { type: string }
 *                       os: { type: string }
 *                       device: { type: string }
 *                       browser: { type: string }
 *                       ip: { type: string }
 *                       location: { type: string, description: IP 归属地 }
 *                       loginType: { type: integer }
 *                       comments: { type: string }
 *                       createTime: { type: string, format: date-time }
 *                       nickname: { type: string }
 *                 count: { type: integer }
 */
const getLoginLogsPage = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', ...filters } = req.query;
    const query = buildLoginLogQuery(filters);
    const skip = (Number(page) - 1) * Number(limit);
    const sortFieldMap = { createTime: 'createdAt', updateTime: 'updatedAt' };
    const sortObj = { [sortFieldMap[sort] || sort]: order === 'asc' ? 1 : -1 };
    const [list, count] = await Promise.all([
      LoginLog.find(query).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
      LoginLog.countDocuments(query)
    ]);

    const usernames = [...new Set(list.map(l => l.username).filter(Boolean))];
    const users = usernames.length
      ? await User.find({ username: { $in: usernames } }, 'username nickname').lean()
      : [];
    const userMap = new Map(users.map(u => [u.username, u]));

    return response.success(res, { list: list.map(l => formatLoginLog(l, userMap)), count });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/logs/login-logs:
 *   get:
 *     tags: [Logs]
 *     summary: 查询登录日志列表（不分页）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: username
 *         schema: { type: string }
 *         description: 用户账号
 *       - in: query
 *         name: nickname
 *         schema: { type: string }
 *         description: 用户昵称
 *       - in: query
 *         name: loginType
 *         schema: { type: integer, enum: [0, 1, 2, 3] }
 *         description: 操作类型, 0登录成功, 1登录失败, 2退出登录, 3续签token
 *       - in: query
 *         name: createTimeStart
 *         schema: { type: string, format: date-time }
 *         description: 开始时间
 *       - in: query
 *         name: createTimeEnd
 *         schema: { type: string, format: date-time }
 *         description: 截止时间
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   username: { type: string }
 *                   os: { type: string }
 *                   device: { type: string }
 *                   browser: { type: string }
 *                   ip: { type: string }
 *                   location: { type: string, description: IP 归属地 }
 *                   loginType: { type: integer }
 *                   comments: { type: string }
 *                   createTime: { type: string, format: date-time }
 *                   nickname: { type: string }
 */
const getLoginLogs = async (req, res, next) => {
  try {
    const query = buildLoginLogQuery(req.query);
    const list = await LoginLog.find(query).sort({ createdAt: -1 }).lean();

    const usernames = [...new Set(list.map(l => l.username).filter(Boolean))];
    const users = usernames.length
      ? await User.find({ username: { $in: usernames } }, 'username nickname').lean()
      : [];
    const userMap = new Map(users.map(u => [u.username, u]));

    return response.success(res, list.map(l => formatLoginLog(l, userMap)));
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
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               createTimeStart: { type: string, format: date-time }
 *               createTimeEnd: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deletedCount: { type: integer }
 */
const clearLoginLogs = async (req, res, next) => {
  try {
    const { createTimeStart, createTimeEnd } = req.body || {};
    const query = {};
    if (createTimeStart || createTimeEnd) {
      query.createdAt = {};
      if (createTimeStart) query.createdAt.$gte = new Date(createTimeStart);
      if (createTimeEnd) query.createdAt.$lte = new Date(createTimeEnd);
    }
    const result = await LoginLog.deleteMany(query);
    return response.success(res, { deletedCount: result.deletedCount }, '清理成功');
  } catch (error) {
    next(error);
  }
};

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
 *         description: 用户账号
 *       - in: query
 *         name: module
 *         schema: { type: string }
 *         description: 操作模块
 *       - in: query
 *         name: status
 *         schema: { type: integer, enum: [0, 1] }
 *         description: 状态, 0成功, 1异常
 *       - in: query
 *         name: createTimeStart
 *         schema: { type: string, format: date-time }
 *         description: 开始时间
 *       - in: query
 *         name: createTimeEnd
 *         schema: { type: string, format: date-time }
 *         description: 截止时间
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 list:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       userId: { type: string }
 *                       username: { type: string }
 *                       nickname: { type: string }
 *                       traceId: { type: string, description: 全链路追踪 ID }
 *                       module: { type: string }
 *                       businessType: { type: string, enum: [INSERT, UPDATE, DELETE, GRANT, EXPORT, IMPORT, CLEAN, OTHER], description: 业务类型 }
 *                       description: { type: string }
 *                       url: { type: string }
 *                       requestMethod: { type: string }
 *                       method: { type: string }
 *                       params: { type: string }
 *                       result: { type: string }
 *                       error: { type: string }
 *                       spendTime: { type: integer }
 *                       os: { type: string }
 *                       device: { type: string }
 *                       browser: { type: string }
 *                       ip: { type: string }
 *                       location: { type: string, description: IP 归属地 }
 *                       status: { type: integer }
 *                       createTime: { type: string, format: date-time }
 *                 count: { type: integer }
 */
const getOperationLogsPage = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', ...filters } = req.query;
    const query = await buildOperationLogQuery(filters);
    const skip = (Number(page) - 1) * Number(limit);
    const sortFieldMap = { createTime: 'createdAt', updateTime: 'updatedAt' };
    const sortObj = { [sortFieldMap[sort] || sort]: order === 'asc' ? 1 : -1 };
    const [list, count] = await Promise.all([
      OperationLog.find(query)
        .populate('userId', 'username nickname')
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      OperationLog.countDocuments(query)
    ]);
    return response.success(res, { list: list.map(l => formatOperationLog(l)), count });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/logs/operation-logs:
 *   get:
 *     tags: [Logs]
 *     summary: 查询操作日志列表（不分页）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: username
 *         schema: { type: string }
 *         description: 用户账号
 *       - in: query
 *         name: module
 *         schema: { type: string }
 *         description: 操作模块
 *       - in: query
 *         name: status
 *         schema: { type: integer, enum: [0, 1] }
 *         description: 状态, 0成功, 1异常
 *       - in: query
 *         name: createTimeStart
 *         schema: { type: string, format: date-time }
 *         description: 开始时间
 *       - in: query
 *         name: createTimeEnd
 *         schema: { type: string, format: date-time }
 *         description: 截止时间
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   userId: { type: string }
 *                   username: { type: string }
 *                   nickname: { type: string }
 *                   traceId: { type: string, description: 全链路追踪 ID }
 *                   module: { type: string }
 *                   businessType: { type: string, enum: [INSERT, UPDATE, DELETE, GRANT, EXPORT, IMPORT, CLEAN, OTHER], description: 业务类型 }
 *                   description: { type: string }
 *                   url: { type: string }
 *                   requestMethod: { type: string }
 *                   method: { type: string }
 *                   params: { type: string }
 *                   result: { type: string }
 *                   error: { type: string }
 *                   spendTime: { type: integer }
 *                   os: { type: string }
 *                   device: { type: string }
 *                   browser: { type: string }
 *                   ip: { type: string }
 *                   location: { type: string, description: IP 归属地 }
 *                   status: { type: integer }
 *                   createTime: { type: string, format: date-time }
 */
const getOperationLogs = async (req, res, next) => {
  try {
    const query = await buildOperationLogQuery(req.query);
    const list = await OperationLog.find(query)
      .populate('userId', 'username nickname')
      .sort({ createdAt: -1 })
      .lean();
    return response.success(res, list.map(l => formatOperationLog(l)));
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
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               createTimeStart: { type: string, format: date-time }
 *               createTimeEnd: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deletedCount: { type: integer }
 */
const clearOperationLogs = async (req, res, next) => {
  try {
    const { createTimeStart, createTimeEnd } = req.body || {};
    const query = {};
    if (createTimeStart || createTimeEnd) {
      query.createdAt = {};
      if (createTimeStart) query.createdAt.$gte = new Date(createTimeStart);
      if (createTimeEnd) query.createdAt.$lte = new Date(createTimeEnd);
    }
    const result = await OperationLog.deleteMany(query);
    return response.success(res, { deletedCount: result.deletedCount }, '清理成功');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLoginLogsPage,
  getLoginLogs,
  clearLoginLogs,
  getOperationLogsPage,
  getOperationLogs,
  clearOperationLogs
};