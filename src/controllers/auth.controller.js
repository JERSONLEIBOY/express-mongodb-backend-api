const User = require('../models/User');
const LoginLog = require('../models/LoginLog');
const { generateToken } = require('../utils/jwt');
const response = require('../utils/response');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      await LoginLog.create({
        username: username || 'unknown',
        loginType: 'login_fail',
        status: 'fail',
        ip: req.ip
      });
      return response.badRequest(res, '用户名和密码不能为空');
    }

    const user = await User.findOne({ username }).populate('roles');

    if (!user) {
      await LoginLog.create({
        username,
        loginType: 'login_fail',
        status: 'fail',
        ip: req.ip
      });
      return response.unauthorized(res, '用户名或密码错误');
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      await LoginLog.create({
        username,
        loginType: 'login_fail',
        status: 'fail',
        ip: req.ip
      });
      return response.unauthorized(res, '用户名或密码错误');
    }

    if (user.status === 'inactive') {
      await LoginLog.create({
        username,
        loginType: 'login_fail',
        status: 'fail',
        ip: req.ip
      });
      return response.unauthorized(res, '用户已被禁用');
    }

    if (user.status === 'locked') {
      await LoginLog.create({
        username,
        loginType: 'login_fail',
        status: 'fail',
        ip: req.ip
      });
      return response.unauthorized(res, '用户已被锁定');
    }

    const token = generateToken({
      userId: user._id,
      username: user.username
    });

    await LoginLog.create({
      username: user.username,
      loginType: 'login_success',
      status: 'success',
      ip: req.ip,
      device: req.get('user-agent')
    });

    return response.success(res, {
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        roles: user.roles,
        permissions: user.roles.flatMap(role => role.permissions || [])
      }
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    return response.success(res, null, '登出成功');
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = req.user;

    const permissions = user.roles.flatMap(role => {
      if (role.permissions) {
        return role.permissions.map(p => p._id.toString());
      }
      return [];
    });

    const uniquePermissions = [...new Set(permissions)];

    return response.success(res, {
      id: user._id,
      username: user.username,
      name: user.name,
      sex: user.sex,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
      permissions: uniquePermissions,
      organization: user.organization
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const user = req.user;

    const token = generateToken({
      userId: user._id,
      username: user.username
    });

    await LoginLog.create({
      username: user.username,
      loginType: 'refresh_token',
      status: 'success',
      ip: req.ip
    });

    return response.success(res, { token });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  getCurrentUser,
  refreshToken
};
