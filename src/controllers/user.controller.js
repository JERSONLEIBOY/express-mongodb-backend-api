const User = require('../models/User');
const response = require('../utils/response');

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags: [Users]
 *     summary: 获取用户列表
 *     description: 分页获取用户列表，支持查询过滤、排序功能
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         description: 用户名模糊搜索
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: 姓名模糊搜索
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, locked]
 *         description: 用户状态
 *       - in: query
 *         name: organization
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 组织 ID
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           default: createdAt
 *           enum: [username, name, createdAt, updatedAt]
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
 *         description: 成功获取用户列表
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
 *                             $ref: '#/components/schemas/User'
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, username, name, status, organization, sortField = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};

    if (username) query.username = new RegExp(username, 'i');
    if (name) query.name = new RegExp(name, 'i');
    if (status) query.status = status;
    if (organization) query.organization = organization;

    const limit = Math.min(parseInt(pageSize, 10) || 20, 100);
    const skip = (parseInt(page, 10) - 1) * limit;

    const sortObj = {};
    sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;

    const [list, total] = await Promise.all([
      User.find(query)
        .populate('organization', 'name')
        .populate('roles', 'name code')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    return response.paginated(res, { list, total, page, pageSize });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: 获取单个用户信息
 *     description: 根据 ID 获取用户的详细信息，包含组织信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 用户 ID
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
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .populate('organization', 'name type')
      .populate('roles', 'name code permissions')
      .lean();

    if (!user) {
      return response.notFound(res, '用户不存在');
    }

    return response.success(res, user);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     tags: [Users]
 *     summary: 创建用户
 *     description: 创建新用户，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: 用户创建成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *                     code:
 *                       type: integer
 *                       example: 201
 *                     message:
 *                       type: string
 *                       example: '用户创建成功'
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const createUser = async (req, res, next) => {
  try {
    const { username, name, sex, email, phone, birthday, password, status, remark, organization, roles } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return response.badRequest(res, '用户名已存在');
    }

    const user = await User.create({
      username,
      name,
      sex,
      email,
      phone,
      birthday,
      password,
      status,
      remark,
      organization,
      roles
    });

    const populatedUser = await User.findById(user._id)
      .populate('organization', 'name')
      .populate('roles', 'name code')
      .lean();

    return response.created(res, populatedUser, '用户创建成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: 更新用户信息
 *     description: 更新指定用户的信息，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 用户 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: 用户更新成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, sex, email, phone, birthday, status, remark, organization, roles } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return response.notFound(res, '用户不存在');
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (sex !== undefined) updates.sex = sex;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (birthday !== undefined) updates.birthday = birthday;
    if (status !== undefined) updates.status = status;
    if (remark !== undefined) updates.remark = remark;
    if (organization !== undefined) updates.organization = organization;
    if (roles !== undefined) updates.roles = roles;

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('organization', 'name')
      .populate('roles', 'name code')
      .lean();

    return response.success(res, updatedUser, '用户更新成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: 删除用户
 *     description: 删除指定用户，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 用户 ID
 *     responses:
 *       204:
 *         description: 用户删除成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: null
 *                     code:
 *                       type: integer
 *                       example: 204
 *                     message:
 *                       type: string
 *                       example: '用户删除成功'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return response.notFound(res, '用户不存在');
    }

    return response.success(res, null, '用户删除成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/users/{id}/status:
 *   put:
 *     tags: [Users]
 *     summary: 更新用户状态
 *     description: 更新指定用户的状态，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 用户 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, locked]
 *                 description: 用户状态
 *     responses:
 *       200:
 *         description: 状态更新成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: null
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'locked'].includes(status)) {
      return response.badRequest(res, '无效的状态值');
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
    if (!user) {
      return response.notFound(res, '用户不存在');
    }

    return response.success(res, null, '状态更新成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/users/{id}/password:
 *   put:
 *     tags: [Users]
 *     summary: 更新用户密码
 *     description: 更新指定用户的密码，用户只能修改自己的密码（非管理员）或任何用户的密码（管理员）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 用户 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: 新密码
 *     responses:
 *       200:
 *         description: 密码修改成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: null
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const updateUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const isAdmin = req.user.roles.some(r => r.code === 'ADMIN');
    if (!isAdmin && req.user._id.toString() !== id) {
      return response.forbidden(res, '只能修改自己的密码');
    }

    if (!password || password.length < 6) {
      return response.badRequest(res, '密码长度不能少于6位');
    }

    const user = await User.findById(id);
    if (!user) {
      return response.notFound(res, '用户不存在');
    }

    user.password = password;
    await user.save();

    return response.success(res, null, '密码修改成功');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  updateUserPassword
};
