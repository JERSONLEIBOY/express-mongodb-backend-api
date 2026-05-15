const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Menus
 *   description: 菜单管理接口
 */

/**
 * @swagger
 * /api/v1/menus:
 *   get:
 *     tags: [Menus]
 *     summary: 获取菜单列表
 *     description: 获取菜单列表，支持过滤条件，返回树形结构
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: 菜单名称（模糊搜索）
 *       - in: query
 *         name: path
 *         schema:
 *           type: string
 *         description: 路由路径（模糊搜索）
 *       - in: query
 *         name: authority
 *         schema:
 *           type: string
 *         description: 权限标识
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: integer
 *         description: 父菜单 ID（0 = 顶级）
 *     responses:
 *       200:
 *         description: 成功获取菜单列表（树形结构）
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       description: 菜单树形结构
 *                       items:
 *                         $ref: '#/components/schemas/Menu'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/', authenticate, menuController.getMenus);

/**
 * @swagger
 * /api/v1/menus/{id}:
 *   get:
 *     tags: [Menus]
 *     summary: 获取单个菜单信息
 *     description: 根据 ID 获取菜单的详细信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 菜单 ID
 *     responses:
 *       200:
 *         description: 成功获取菜单信息
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Menu'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticate, menuController.getMenuById);

/**
 * @swagger
 * /api/v1/menus:
 *   post:
 *     tags: [Menus]
 *     summary: 创建菜单
 *     description: 创建新菜单，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 50
 *                 required: true
 *                 description: 菜单名称
 *               menuType:
 *                 type: integer
 *                 enum: [0, 1, 2]
 *                 description: 菜单类型（0目录,1菜单,2按钮）
 *               path:
 *                 type: string
 *                 maxLength: 200
 *                 description: 菜单路径
 *               parentId:
 *                 type: integer
 *                 description: 父菜单 ID（0=顶级）
 *               sortNumber:
 *                 type: integer
 *                 default: 0
 *                 description: 排序号
 *               icon:
 *                 type: string
 *                 maxLength: 100
 *                 description: 图标
 *               hide:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: 是否隐藏（0否,1是）
 *               component:
 *                 type: string
 *                 maxLength: 200
 *                 description: 组件名
 *               redirect:
 *                 type: string
 *                 maxLength: 200
 *                 description: 重定向地址
 *               authority:
 *                 type: string
 *                 description: 权限标识
 *               meta:
 *                 type: string
 *                 description: 路由元信息
 *               openType:
 *                 type: integer
 *                 description: 打开方式
 *               checked:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: 权限树回显选中状态
 *     responses:
 *       201:
 *         description: 菜单创建成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Menu'
 *                     code:
 *                       type: integer
 *                       example: 201
 *                     message:
 *                       type: string
 *                       example: '菜单创建成功'
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/', authenticate, authorize('ADMIN'), menuController.createMenu);

/**
 * @swagger
 * /api/v1/menus/{id}:
 *   put:
 *     tags: [Menus]
 *     summary: 更新菜单信息
 *     description: 更新指定菜单的信息，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 菜单 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 50
 *                 description: 菜单名称
 *               menuType:
 *                 type: integer
 *                 enum: [0, 1, 2]
 *                 description: 菜单类型（0目录,1菜单,2按钮）
 *               path:
 *                 type: string
 *                 maxLength: 200
 *                 description: 菜单路径
 *               parentId:
 *                 type: integer
 *                 description: 父菜单 ID（0=顶级）
 *               sortNumber:
 *                 type: integer
 *                 description: 排序号
 *               icon:
 *                 type: string
 *                 maxLength: 100
 *                 description: 图标
 *               hide:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: 是否隐藏（0否,1是）
 *               component:
 *                 type: string
 *                 maxLength: 200
 *                 description: 组件名
 *               redirect:
 *                 type: string
 *                 maxLength: 200
 *                 description: 重定向地址
 *               authority:
 *                 type: string
 *                 description: 权限标识
 *               meta:
 *                 type: string
 *                 description: 路由元信息
 *               openType:
 *                 type: integer
 *                 description: 打开方式
 *               checked:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: 权限树回显选中状态
 *     responses:
 *       200:
 *         description: 菜单更新成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Menu'
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
router.put('/:id', authenticate, authorize('ADMIN'), menuController.updateMenu);

/**
 * @swagger
 * /api/v1/menus/{id}:
 *   delete:
 *     tags: [Menus]
 *     summary: 删除菜单
 *     description: 删除指定菜单，不能删除有子菜单的菜单，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 菜单 ID
 *     responses:
 *       204:
 *         description: 菜单删除成功
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
 *                       example: '菜单删除成功'
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
router.delete('/:id', authenticate, authorize('ADMIN'), menuController.deleteMenu);

module.exports = router;
