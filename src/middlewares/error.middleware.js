const { logger } = require('../config');
const response = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return response.badRequest(res, messages.join(', '));
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return response.badRequest(res, '无效的 ID 格式');
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return response.badRequest(res, `${field} 已存在`);
  }

  if (err.name === 'TokenExpiredError') {
    return response.unauthorized(res, 'Token 已过期');
  }

  if (err.name === 'JsonWebTokenError') {
    return response.unauthorized(res, '无效的 Token');
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return response.badRequest(res, '文件大小超过限制');
    }
    return response.badRequest(res, err.message);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  return response.serverError(res, message);
};

const notFoundHandler = (req, res) => {
  return response.notFound(res, `路由 ${req.originalUrl} 不存在`);
};

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  AppError
};
