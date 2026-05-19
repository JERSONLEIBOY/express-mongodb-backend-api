const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

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
router.get('/page', roleController.getRolesPage);

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
router.get('/', roleController.getRoles);

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
router.post('/', authorize('ADMIN'), roleController.createRole);

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
router.delete('/batch', authorize('ADMIN'), roleController.deleteRoleBatch);

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
router.put('/:id', authorize('ADMIN'), roleController.updateRole);

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
router.delete('/:id', authorize('ADMIN'), roleController.deleteRole);

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
router.get('/:id/menus', roleController.getRoleMenus);

/**
 * @swagger
 * /api/v1/roles/{id}/menus:
 *   put:
 *     tags: [Roles]
 *     summary: 修改角色菜单
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
 *             type: array
 *             items:
 *               type: string
 *     responses:
 *       200:
 *         description: 成功
 */
router.put('/:id/menus', authorize('ADMIN'), roleController.updateRoleMenus);

module.exports = router;
