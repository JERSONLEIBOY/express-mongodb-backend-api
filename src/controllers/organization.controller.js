const Organization = require('../models/Organization');
const response = require('../utils/response');

const ORGANIZATION_TYPES = ['company', 'department', 'team'];

/**
 * @swagger
 * /api/v1/organizations:
 *   get:
 *     tags: [Organizations]
 *     summary: 获取组织列表
 *     description: 获取组织列表，支持过滤条件，返回树形结构
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [company, department, team]
 *         description: 组织类型
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: 组织状态
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: 组织名模糊搜索
 *     responses:
 *       200:
 *         description: 成功获取组织列表（树形结构）
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       description: 组织树形结构
 *                       items:
 *                         $ref: '#/components/schemas/Organization'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const getOrganizations = async (req, res, next) => {
  try {
    const { type, status, name } = req.query;

    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (name) query.name = new RegExp(name, 'i');

    const organizations = await Organization.find(query)
      .sort({ sort: 1, createdAt: -1 })
      .lean();

    const tree = buildOrganizationTree(organizations);

    return response.success(res, tree);
  } catch (error) {
    next(error);
  }
};

const buildOrganizationTree = (organizations, parentId = null) => {
  return organizations
    .filter(org => {
      if (parentId === null) {
        return org.parentId === null || org.parentId === undefined;
      }
      return org.parentId && org.parentId.toString() === parentId.toString();
    })
    .map(org => ({
      ...org,
      children: buildOrganizationTree(organizations, org._id)
    }))
    .sort((a, b) => a.sort - b.sort);
};

/**
 * @swagger
 * /api/v1/organizations/{id}:
 *   get:
 *     tags: [Organizations]
 *     summary: 获取单个组织信息
 *     description: 根据 ID 获取组织的详细信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 组织 ID
 *     responses:
 *       200:
 *         description: 成功获取组织信息
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Organization'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const getOrganizationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const organization = await Organization.findById(id)
      .populate('parentId', 'name')
      .lean();

    if (!organization) {
      return response.notFound(res, '机构不存在');
    }

    return response.success(res, organization);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/organizations:
 *   post:
 *     tags: [Organizations]
 *     summary: 创建组织
 *     description: 创建新组织，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 required: true
 *                 description: 组织名称
 *               type:
 *                 type: string
 *                 enum: [company, department, team]
 *                 default: team
 *                 description: 组织类型
 *               parentId:
 *                 type: string
 *                 format: ObjectId
 *                 default: null
 *                 description: 父组织 ID
 *               sort:
 *                 type: integer
 *                 default: 0
 *                 description: 排序
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *                 description: 组织状态
 *     responses:
 *       201:
 *         description: 组织创建成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Organization'
 *                     code:
 *                       type: integer
 *                       example: 201
 *                     message:
 *                       type: string
 *                       example: '组织创建成功'
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const createOrganization = async (req, res, next) => {
  try {
    const { name, type, parentId, sort, status } = req.body;

    if (type !== undefined && !ORGANIZATION_TYPES.includes(type)) {
      return response.badRequest(res, `机构类型必须是 ${ORGANIZATION_TYPES.join('/')} 之一`);
    }

    if (parentId) {
      const parentOrg = await Organization.findById(parentId);
      if (!parentOrg) {
        return response.badRequest(res, '父机构不存在');
      }
    }

    const organization = await Organization.create({
      name,
      type,
      parentId,
      sort,
      status
    });

    const populatedOrg = await Organization.findById(organization._id)
      .populate('parentId', 'name')
      .lean();

    return response.created(res, populatedOrg, '机构创建成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/organizations/{id}:
 *   put:
 *     tags: [Organizations]
 *     summary: 更新组织信息
 *     description: 更新指定组织的信息，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 组织 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: 组织名称
 *               type:
 *                 type: string
 *                 enum: [company, department, team]
 *                 description: 组织类型
 *               parentId:
 *                 type: string
 *                 format: ObjectId
 *                 description: 父组织 ID
 *               sort:
 *                 type: integer
 *                 description: 排序
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: 组织状态
 *     responses:
 *       200:
 *         description: 组织更新成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Organization'
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
const updateOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, parentId, sort, status } = req.body;

    if (type !== undefined && !ORGANIZATION_TYPES.includes(type)) {
      return response.badRequest(res, `机构类型必须是 ${ORGANIZATION_TYPES.join('/')} 之一`);
    }

    const organization = await Organization.findById(id);
    if (!organization) {
      return response.notFound(res, '机构不存在');
    }

    if (parentId && parentId === id) {
      return response.badRequest(res, '不能将自己设为父机构');
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (parentId !== undefined) updates.parentId = parentId;
    if (sort !== undefined) updates.sort = sort;
    if (status !== undefined) updates.status = status;

    const updatedOrg = await Organization.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('parentId', 'name')
      .lean();

    return response.success(res, updatedOrg, '机构更新成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/organizations/{id}:
 *   delete:
 *     tags: [Organizations]
 *     summary: 删除组织
 *     description: 删除指定组织，不能删除有子组织的组织，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 组织 ID
 *     responses:
 *       204:
 *         description: 组织删除成功
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
 *                       example: '组织删除成功'
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
const deleteOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;

    const organization = await Organization.findById(id);
    if (!organization) {
      return response.notFound(res, '机构不存在');
    }

    const childOrgs = await Organization.find({ parentId: id });
    if (childOrgs.length > 0) {
      return response.badRequest(res, '存在子机构，无法删除');
    }

    await Organization.findByIdAndDelete(id);

    return response.success(res, null, '机构删除成功');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization
};
