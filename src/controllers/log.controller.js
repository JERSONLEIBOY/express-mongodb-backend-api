const LoginLog = require('../models/LoginLog');
const OperationLog = require('../models/OperationLog');
const response = require('../utils/response');

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
