const Role = require('../models/Role');
const Menu = require('../models/Menu');
const response = require('../utils/response');
const { formatRole, formatMenu } = require('../utils/formatters');

const buildQuery = ({ roleName, roleCode, comments }) => {
  const query = {};
  if (roleName) query.roleName = new RegExp(roleName, 'i');
  if (roleCode) query.roleCode = new RegExp(roleCode, 'i');
  if (comments) query.comments = new RegExp(comments, 'i');
  return query;
};

/**
 * @swagger
 * /api/v1/roles/page:
 *   get:
 *     tags: [Roles]
 *     summary: 分页查询角色
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
 *         name: roleName
 *         schema: { type: string }
 *       - in: query
 *         name: roleCode
 *         schema: { type: string }
 *       - in: query
 *         name: comments
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 */
const getRolesPage = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, ...filters } = req.query;
    const query = buildQuery(filters);
    const skip = (Number(page) - 1) * Number(limit);
    const [list, count] = await Promise.all([
      Role.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Role.countDocuments(query)
    ]);
    return response.success(res, { list: list.map(formatRole), count });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     tags: [Roles]
 *     summary: 查询角色列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: roleName
 *         schema: { type: string }
 *       - in: query
 *         name: roleCode
 *         schema: { type: string }
 *       - in: query
 *         name: comments
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 */
const getRoles = async (req, res, next) => {
  try {
    const list = await Role.find(buildQuery(req.query)).sort({ createdAt: -1 }).lean();
    return response.success(res, list.map(formatRole));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/roles:
 *   post:
 *     tags: [Roles]
 *     summary: 添加角色
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleName, roleCode]
 *             properties:
 *               roleName: { type: string }
 *               roleCode: { type: string }
 *               comments: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 */
const createRole = async (req, res, next) => {
  try {
    const { roleName, roleCode, comments } = req.body;
    if (await Role.findOne({ roleCode: roleCode.toUpperCase() }).lean()) {
      return response.badRequest(res, '角色标识已存在');
    }
    const role = await Role.create({ roleName, roleCode, comments });
    return response.created(res, formatRole(role.toObject()), '角色创建成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   put:
 *     tags: [Roles]
 *     summary: 修改角色
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roleName: { type: string }
 *               comments: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 */
const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roleName, comments } = req.body;
    if (!await Role.findById(id).lean()) return response.notFound(res, '角色不存在');
    const updates = {};
    if (roleName !== undefined) updates.roleName = roleName;
    if (comments !== undefined) updates.comments = comments;
    const updated = await Role.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
    return response.success(res, formatRole(updated), '角色更新成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   delete:
 *     tags: [Roles]
 *     summary: 删除角色
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 */
const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id).lean();
    if (!role) return response.notFound(res, '角色不存在');
    if (role.roleCode === 'ADMIN') return response.badRequest(res, '不能删除管理员角色');
    await Role.findByIdAndDelete(id);
    return response.success(res, null, '角色删除成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/roles/batch:
 *   delete:
 *     tags: [Roles]
 *     summary: 批量删除角色
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: string
 *     responses:
 *       200:
 *         description: 成功
 */
const deleteRoleBatch = async (req, res, next) => {
  try {
    const ids = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return response.badRequest(res, '请提供要删除的ids');
    await Role.deleteMany({ _id: { $in: ids }, roleCode: { $ne: 'ADMIN' } });
    return response.success(res, null, '批量删除成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/roles/{id}/menus:
 *   get:
 *     tags: [Roles]
 *     summary: 获取角色分配的菜单
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 */
const getRoleMenus = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id).lean();
    if (!role) return response.notFound(res, '角色不存在');
    const assignedIds = new Set((role.menus || []).map(id => id.toString()));
    const menus = await Menu.find({}).sort({ sortNumber: 1 }).lean();
    return response.success(res, menus.map(m => ({
      ...formatMenu(m),
      checked: assignedIds.has(m._id.toString())
    })));
  } catch (error) {
    next(error);
  }
};
const updateRoleMenus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const menuIds = req.body;
    if (!await Role.findById(id).lean()) return response.notFound(res, '角色不存在');
    await Role.findByIdAndUpdate(id, { menus: menuIds });
    return response.success(res, null, '角色菜单更新成功');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRolesPage,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  deleteRoleBatch,
  getRoleMenus,
  updateRoleMenus
};
