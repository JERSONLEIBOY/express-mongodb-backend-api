const Role = require('../models/Role');
const response = require('../utils/response');

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     tags: [Roles]
 *     summary: 获取角色列表
 *     description: 分页获取角色列表，支持查询过滤、排序功能
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
 *         name: name
 *         schema:
 *           type: string
 *         description: 角色名模糊搜索
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: 角色代码模糊搜索
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: 角色状态
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           default: createdAt
 *           enum: [name, code, createdAt, updatedAt]
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
 *         description: 成功获取角色列表
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
 *                             $ref: '#/components/schemas/Role'
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const getRoles = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, name, code, status, sortField = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};

    if (name) query.name = new RegExp(name, 'i');
    if (code) query.code = new RegExp(code, 'i');
    if (status) query.status = status;

    const limit = Math.min(parseInt(pageSize, 10) || 20, 100);
    const skip = (parseInt(page, 10) - 1) * limit;

    const sortObj = {};
    sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;

    const [list, total] = await Promise.all([
      Role.find(query)
        .populate('permissions', 'name type path')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Role.countDocuments(query)
    ]);

    return response.paginated(res, { list, total, page, pageSize });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   get:
 *     tags: [Roles]
 *     summary: 获取单个角色信息
 *     description: 根据 ID 获取角色的详细信息，包含权限信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 角色 ID
 *     responses:
 *       200:
 *         description: 成功获取角色信息
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Role'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id)
      .populate('permissions', 'name type path component')
      .lean();

    if (!role) {
      return response.notFound(res, '角色不存在');
    }

    return response.success(res, role);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/roles:
 *   post:
 *     tags: [Roles]
 *     summary: 创建角色
 *     description: 创建新角色，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoleRequest'
 *     responses:
 *       201:
 *         description: 角色创建成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Role'
 *                     code:
 *                       type: integer
 *                       example: 201
 *                     message:
 *                       type: string
 *                       example: '角色创建成功'
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const createRole = async (req, res, next) => {
  try {
    const { name, code, remark, permissions, status } = req.body;

    const existingRole = await Role.findOne({ code: code.toUpperCase() });
    if (existingRole) {
      return response.badRequest(res, '角色编码已存在');
    }

    const role = await Role.create({
      name,
      code: code.toUpperCase(),
      remark,
      permissions,
      status
    });

    const populatedRole = await Role.findById(role._id)
      .populate('permissions', 'name type path')
      .lean();

    return response.created(res, populatedRole, '角色创建成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   put:
 *     tags: [Roles]
 *     summary: 更新角色信息
 *     description: 更新指定角色的信息，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 角色 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *                 description: 角色名称
 *               remark:
 *                 type: string
 *                 maxLength: 500
 *                 description: 备注
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: ObjectId
 *                 description: 权限 ID 列表
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: 角色状态
 *     responses:
 *       200:
 *         description: 角色更新成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Role'
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
const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, remark, permissions, status } = req.body;

    const role = await Role.findById(id);
    if (!role) {
      return response.notFound(res, '角色不存在');
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (remark !== undefined) updates.remark = remark;
    if (permissions !== undefined) updates.permissions = permissions;
    if (status !== undefined) updates.status = status;

    const updatedRole = await Role.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('permissions', 'name type path')
      .lean();

    return response.success(res, updatedRole, '角色更新成功');
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
 *     description: 删除指定角色，不能删除管理员角色，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 角色 ID
 *     responses:
 *       204:
 *         description: 角色删除成功
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
 *                       example: '角色删除成功'
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
const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id);
    if (!role) {
      return response.notFound(res, '角色不存在');
    }

    if (role.code === 'ADMIN') {
      return response.badRequest(res, '不能删除管理员角色');
    }

    await Role.findByIdAndDelete(id);

    return response.success(res, null, '角色删除成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/roles/{id}/permissions:
 *   put:
 *     tags: [Roles]
 *     summary: 更新角色权限
 *     description: 批量更新指定角色的权限，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 角色 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: ObjectId
 *                 description: 权限 ID 列表
 *     responses:
 *       200:
 *         description: 权限更新成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Role'
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
const updateRolePermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    const role = await Role.findById(id);
    if (!role) {
      return response.notFound(res, '角色不存在');
    }

    const updatedRole = await Role.findByIdAndUpdate(
      id,
      { permissions },
      { new: true, runValidators: true }
    )
      .populate('permissions', 'name type path')
      .lean();

    return response.success(res, updatedRole, '权限更新成功');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  updateRolePermissions
};
