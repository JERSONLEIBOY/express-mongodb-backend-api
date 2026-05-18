const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organization.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Organizations
 *   description: 组织管理接口
 */

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
 *         name: organizationName
 *         schema:
 *           type: string
 *         description: 机构名称（模糊搜索）
 *       - in: query
 *         name: organizationFullName
 *         schema:
 *           type: string
 *         description: 机构全称（模糊搜索）
 *       - in: query
 *         name: organizationType
 *         schema:
 *           type: string
 *         description: 机构类型（字典值）
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
 *                       items:
 *                         $ref: '#/components/schemas/Organization'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/', authenticate, organizationController.getOrganizations);

/**
 * @swagger
 * /api/v1/organizations/{id}:
 *   get:
 *     tags: [Organizations]
 *     summary: 获取单个组织信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
router.get('/:id', authenticate, organizationController.getOrganizationById);

/**
 * @swagger
 * /api/v1/organizations:
 *   post:
 *     tags: [Organizations]
 *     summary: 创建组织
 *     description: 仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationName
 *             properties:
 *               organizationName:
 *                 type: string
 *                 maxLength: 100
 *                 description: 机构名称
 *               organizationFullName:
 *                 type: string
 *                 description: 机构全称
 *               organizationCode:
 *                 type: string
 *                 description: 机构代码
 *               organizationType:
 *                 type: string
 *                 description: 机构类型（字典值）
 *               parentId:
 *                 type: string
 *                 default: '0'
 *                 description: 上级机构 ID，0 表示顶级
 *               sortNumber:
 *                 type: integer
 *                 default: 0
 *                 description: 排序号
 *               comments:
 *                 type: string
 *                 description: 备注
 *     responses:
 *       201:
 *         description: 机构创建成功
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
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/', authenticate, authorize('ADMIN'), organizationController.createOrganization);

/**
 * @swagger
 * /api/v1/organizations/{id}:
 *   put:
 *     tags: [Organizations]
 *     summary: 更新组织信息
 *     description: 仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 组织 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               organizationName:
 *                 type: string
 *                 maxLength: 100
 *                 description: 机构名称
 *               organizationFullName:
 *                 type: string
 *                 description: 机构全称
 *               organizationCode:
 *                 type: string
 *                 description: 机构代码
 *               organizationType:
 *                 type: string
 *                 description: 机构类型（字典值）
 *               parentId:
 *                 type: string
 *                 description: 上级机构 ID
 *               sortNumber:
 *                 type: integer
 *                 description: 排序号
 *               comments:
 *                 type: string
 *                 description: 备注
 *     responses:
 *       200:
 *         description: 机构更新成功
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
router.put('/:id', authenticate, authorize('ADMIN'), organizationController.updateOrganization);

/**
 * @swagger
 * /api/v1/organizations/{id}:
 *   delete:
 *     tags: [Organizations]
 *     summary: 删除组织
 *     description: 不能删除有子组织的组织，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 组织 ID
 *     responses:
 *       200:
 *         description: 机构删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
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
router.delete('/:id', authenticate, authorize('ADMIN'), organizationController.deleteOrganization);

module.exports = router;
