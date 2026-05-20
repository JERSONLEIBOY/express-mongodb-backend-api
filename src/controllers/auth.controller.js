const crypto = require('crypto');
const svgCaptcha = require('svg-captcha');
const User = require('../models/User');
const Menu = require('../models/Menu');
const Organization = require('../models/Organization');
const DictionaryItem = require('../models/DictionaryItem');
const LoginLog = require('../models/LoginLog');
const { generateToken } = require('../utils/jwt');
const response = require('../utils/response');
const captchaStore = require('../utils/captchaStore');
const { formatRole, formatMenu } = require('../utils/formatters');
const { parseUA } = require('../middlewares/logger.middleware');
const { lookupLocation } = require('../utils/ipLocation');

const buildLoginLog = (req, { username, nickname, loginType, comments }) => {
  const ua = parseUA(req.get('user-agent') || '');
  const ip = req.ip;
  return {
    username: username || 'unknown',
    nickname: nickname || '',
    os: ua.os,
    device: ua.device,
    browser: ua.browser,
    ip,
    location: lookupLocation(ip),
    loginType,
    comments: comments || ''
  };
};

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
const getCaptcha = (req, res) => {
  const captcha = svgCaptcha.create({ noise: 2, color: true });
  const captchaId = crypto.randomUUID();
  captchaStore.set(captchaId, captcha.text);
  const base64 = 'data:image/svg+xml;base64,' + Buffer.from(captcha.data).toString('base64');
  return response.success(res, { captchaId, base64 });
};

const login = async (req, res, next) => {
  try {
    const { username, password, captchaId, captchaCode } = req.body;

    if (!captchaStore.verify(captchaId, captchaCode)) {
      await LoginLog.create(buildLoginLog(req, { username: username || 'unknown', loginType: 1, comments: '验证码错误或已过期' }));
      return response.badRequest(res, '验证码错误或已过期');
    }

    if (!username || !password) {
      await LoginLog.create(buildLoginLog(req, { username, loginType: 1, comments: '用户名或密码为空' }));
      return response.badRequest(res, '用户名和密码不能为空');
    }

    const user = await User.findOne({ username }).populate('roles');

    if (!user) {
      await LoginLog.create(buildLoginLog(req, { username, loginType: 1, comments: '用户不存在' }));
      return response.unauthorized(res, '用户名或密码错误');
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      await LoginLog.create(buildLoginLog(req, { username, nickname: user.nickname, loginType: 1, comments: '密码错误' }));
      return response.unauthorized(res, '用户名或密码错误');
    }

    if (user.status === 'inactive') {
      await LoginLog.create(buildLoginLog(req, { username, nickname: user.nickname, loginType: 1, comments: '用户已禁用' }));
      return response.unauthorized(res, '用户已被禁用');
    }

    if (user.status === 'locked') {
      await LoginLog.create(buildLoginLog(req, { username, nickname: user.nickname, loginType: 1, comments: '用户已锁定' }));
      return response.unauthorized(res, '用户已被锁定');
    }

    const token = generateToken({
      userId: user._id,
      username: user.username
    });

    await LoginLog.create(buildLoginLog(req, { username: user.username, nickname: user.nickname, loginType: 0, comments: '登录成功' }));

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
    if (req.user) {
      await LoginLog.create(buildLoginLog(req, {
        username: req.user.username,
        nickname: req.user.nickname,
        loginType: 2,
        comments: '退出登录'
      }));
    }
    return response.success(res, null, '登出成功');
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = req.user;

    const isSuperAdmin = user.roles.some(r => r.roleCode === 'ADMIN');
    let authorityMenus;
    if (isSuperAdmin) {
      authorityMenus = await Menu.find({}).sort({ sortNumber: 1 }).lean();
    } else {
      const menuIds = [...new Set(
        user.roles.flatMap(r => (r.menus || []).map(id => id.toString()))
      )];
      authorityMenus = menuIds.length
        ? await Menu.find({ _id: { $in: menuIds } }).sort({ sortNumber: 1 }).lean()
        : [];
    }

    let organizationName = '';
    if (user.organizationId) {
      const org = await Organization.findById(user.organizationId)
        .select('organizationName')
        .lean();
      organizationName = org ? org.organizationName : '';
    }

    let sexName = '';
    if (user.sex) {
      const item = await DictionaryItem.findOne({
        dictCode: 'sex',
        dictDataCode: user.sex
      }).lean();
      sexName = item ? item.dictDataName : '';
    }

    return response.success(res, {
      userId: user._id,
      username: user.username,
      nickname: user.nickname || '',
      avatar: user.avatar || '',
      sex: user.sex || '',
      sexName,
      phone: user.phone || '',
      email: user.email || '',
      birthday: user.birthday || null,
      introduction: user.introduction || '',
      organizationId: user.organizationId || '',
      organizationName,
      status: user.status,
      address: user.address || '',
      tellPre: user.tellPre || '',
      tell: user.tell || '',
      roles: user.roles.map(r => formatRole(r.toObject ? r.toObject() : r)),
      authorities: authorityMenus.map(formatMenu),
      createTime: user.createdAt
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

    await LoginLog.create(buildLoginLog(req, {
      username: user.username,
      nickname: user.nickname,
      loginType: 3,
      comments: '续签 token'
    }));

    return response.success(res, { token });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCaptcha,
  login,
  logout,
  getCurrentUser,
  refreshToken
};
