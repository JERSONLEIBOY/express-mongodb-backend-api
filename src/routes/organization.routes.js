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
router.get('/', organizationController.getOrganizations);

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
router.get('/:id', organizationController.getOrganizationById);

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
router.post('/', authorize('ADMIN'), organizationController.createOrganization);

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
router.put('/:id', authorize('ADMIN'), organizationController.updateOrganization);

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
router.delete('/:id', authorize('ADMIN'), organizationController.deleteOrganization);

module.exports = router;
