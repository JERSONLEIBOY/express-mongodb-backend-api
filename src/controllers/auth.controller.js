const User = require('../models/User');
const LoginLog = require('../models/LoginLog');
const { generateToken } = require('../utils/jwt');
const response = require('../utils/response');

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
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
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
const logout = async (req, res, next) => {
  try {
    return response.success(res, null, '登出成功');
  } catch (error) {
    next(error);
  }
};

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
