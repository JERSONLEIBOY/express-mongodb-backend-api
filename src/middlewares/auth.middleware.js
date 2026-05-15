const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const response = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.unauthorized(res, '未提供认证令牌');
    }

    const token = authHeader.substring(7);

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).populate({ path: 'roles', populate: { path: 'permissions' } });

    if (!user) {
      return response.unauthorized(res, '用户不存在');
    }

    if (user.status === 'inactive') {
      return response.unauthorized(res, '用户已被禁用');
    }

    if (user.status === 'locked') {
      return response.unauthorized(res, '用户已被锁定');
    }

    req.user = user;
    next();
  } catch (error) {
    return response.unauthorized(res, error.message);
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return response.unauthorized(res, '请先登录');
    }

    const userRoles = req.user.roles.map(role => role.code);

    const hasPermission = allowedRoles.some(role => userRoles.includes(role));

    if (!hasPermission && !userRoles.includes('ADMIN')) {
      return response.forbidden(res, '权限不足');
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).populate('roles');

      if (user && user.status === 'active') {
        req.user = user;
      }
    }
  } catch (error) {
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};
