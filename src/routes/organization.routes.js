const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organization.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

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
router.get('/page', organizationController.getOrganizationsPage);

/**
 * @swagger
 * /api/v1/organizations:
 *   get:
 *     tags: [Organizations]
 *     summary: 查询机构列表
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
router.get('/', organizationController.getOrganizations);

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
router.post('/', authorize('ADMIN'), organizationController.createOrganization);

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
router.put('/:id', authorize('ADMIN'), organizationController.updateOrganization);

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
router.delete('/:id', authorize('ADMIN'), organizationController.deleteOrganization);

module.exports = router;
