const Organization = require('../models/Organization');
const DictionaryItem = require('../models/DictionaryItem');
const response = require('../utils/response');

const getOrgTypeMap = async () => {
  const items = await DictionaryItem.find({ dictCode: 'organization_type' }).lean();
  return Object.fromEntries(items.map(i => [i.dictDataCode, i.dictDataName]));
};

const formatOrg = (org, typeMap = {}) => ({
  organizationId: org._id,
  parentId: org.parentId ?? '0',
  organizationName: org.organizationName,
  organizationFullName: org.organizationFullName ?? null,
  organizationCode: org.organizationCode ?? null,
  organizationType: org.organizationType ?? null,
  organizationTypeName: typeMap[org.organizationType] ?? null,
  sortNumber: org.sortNumber,
  comments: org.comments ?? null,
  createTime: org.createdAt
});

const buildQuery = ({ organizationName, organizationFullName, organizationType }) => {
  const query = {};
  if (organizationName) query.organizationName = new RegExp(organizationName, 'i');
  if (organizationFullName) query.organizationFullName = new RegExp(organizationFullName, 'i');
  if (organizationType) query.organizationType = organizationType;
  return query;
};

/**
 * @swagger
 * /api/v1/organizations/page:
 *   get:
 *     tags: [Organizations]
 *     summary: 分页查询机构
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
 *         name: organizationName
 *         schema: { type: string }
 *       - in: query
 *         name: organizationFullName
 *         schema: { type: string }
 *       - in: query
 *         name: organizationType
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 */
const getOrganizationsPage = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, ...filters } = req.query;
    const query = buildQuery(filters);
    const skip = (Number(page) - 1) * Number(limit);
    const [list, count, typeMap] = await Promise.all([
      Organization.find(query).sort({ sortNumber: 1 }).skip(skip).limit(Number(limit)).lean(),
      Organization.countDocuments(query),
      getOrgTypeMap()
    ]);
    return response.success(res, { list: list.map(o => formatOrg(o, typeMap)), count });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/organizations:
 *   get:
 *     tags: [Organizations]
 *     summary: 查询机构列表（树形）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationName
 *         schema: { type: string }
 *       - in: query
 *         name: organizationFullName
 *         schema: { type: string }
 *       - in: query
 *         name: organizationType
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 */
const getOrganizations = async (req, res, next) => {
  try {
    const [orgs, typeMap] = await Promise.all([
      Organization.find(buildQuery(req.query)).sort({ sortNumber: 1 }).lean(),
      getOrgTypeMap()
    ]);
    return response.success(res, orgs.map(o => formatOrg(o, typeMap)));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/organizations:
 *   post:
 *     tags: [Organizations]
 *     summary: 添加机构
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [organizationName]
 *             properties:
 *               organizationName: { type: string }
 *               organizationFullName: { type: string }
 *               organizationCode: { type: string }
 *               organizationType: { type: string }
 *               parentId: { type: string, default: '0' }
 *               sortNumber: { type: integer }
 *               comments: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 */
const createOrganization = async (req, res, next) => {
  try {
    const { organizationName, organizationFullName, organizationCode, organizationType, parentId, sortNumber, comments } = req.body;

    if (parentId && parentId !== '0') {
      const parent = await Organization.findById(parentId).lean();
      if (!parent) return response.badRequest(res, '父机构不存在');
    }

    const org = await Organization.create({
      organizationName, organizationFullName, organizationCode,
      organizationType, parentId: parentId || '0', sortNumber, comments
    });

    return response.created(res, formatOrg(org.toObject()), '机构创建成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/organizations/{id}:
 *   put:
 *     tags: [Organizations]
 *     summary: 修改机构
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
 *               organizationName: { type: string }
 *               organizationFullName: { type: string }
 *               organizationCode: { type: string }
 *               organizationType: { type: string }
 *               parentId: { type: string }
 *               sortNumber: { type: integer }
 *               comments: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 */
const updateOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { organizationName, organizationFullName, organizationCode, organizationType, parentId, sortNumber, comments } = req.body;

    if (!await Organization.findById(id).lean()) return response.notFound(res, '机构不存在');
    if (parentId && parentId === id) return response.badRequest(res, '不能将自己设为父机构');

    const updates = {};
    if (organizationName !== undefined) updates.organizationName = organizationName;
    if (organizationFullName !== undefined) updates.organizationFullName = organizationFullName;
    if (organizationCode !== undefined) updates.organizationCode = organizationCode;
    if (organizationType !== undefined) updates.organizationType = organizationType;
    if (parentId !== undefined) updates.parentId = parentId;
    if (sortNumber !== undefined) updates.sortNumber = sortNumber;
    if (comments !== undefined) updates.comments = comments;

    const updated = await Organization.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
    return response.success(res, formatOrg(updated), '机构更新成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/organizations/{id}:
 *   delete:
 *     tags: [Organizations]
 *     summary: 删除机构
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
const deleteOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!await Organization.findById(id).lean()) return response.notFound(res, '机构不存在');
    if (await Organization.countDocuments({ parentId: id })) return response.badRequest(res, '存在子机构，无法删除');
    await Organization.findByIdAndDelete(id);
    return response.success(res, null, '机构删除成功');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrganizationsPage,
  getOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization
};
