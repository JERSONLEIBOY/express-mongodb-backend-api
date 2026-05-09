const OperationLog = require('../models/OperationLog');
const { logger } = require('../config');

const operationLogger = async (req, res, next) => {
  if (req.path.startsWith('/api') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const startTime = Date.now();

    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      const logData = {
        module: extractModule(req.path),
        function: extractFunction(req.path),
        url: req.originalUrl,
        method: req.method,
        params: req.method !== 'GET' ? req.body : req.query,
        status: res.statusCode >= 400 ? 'fail' : 'success',
        operator: req.user ? req.user._id : null,
        operationTime: new Date(),
        ip: req.ip || req.connection.remoteAddress,
        duration,
        data: res.statusCode >= 400 ? null : undefined
      };

      try {
        await OperationLog.create(logData);
      } catch (error) {
        logger.error('Failed to save operation log:', error);
      }
    });
  }

  next();
};

const extractModule = (path) => {
  const parts = path.split('/').filter(Boolean);
  if (parts.length >= 2) {
    return parts[1].replace(/-/g, '_');
  }
  return 'unknown';
};

const extractFunction = (path) => {
  const parts = path.split('/').filter(Boolean);
  if (parts.length >= 3) {
    const method = parts[2].toUpperCase();
    if (['USERS', 'ROLES', 'MENUS', 'ORGANIZATIONS', 'DICTIONARIES', 'FILES', 'AUTH'].includes(method)) {
      return method;
    }
  }
  return 'unknown';
};

const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });

  next();
};

module.exports = {
  operationLogger,
  requestLogger
};
