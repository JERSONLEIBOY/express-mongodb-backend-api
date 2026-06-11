const Menu = require('../models/Menu');
const Role = require('../models/Role');
const response = require('../utils/response');

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
const formatMenu = (menu) => ({
  menuId: menu._id,
  parentId: menu.parentId ?? 0,
  title: menu.title,
  path: menu.path ?? null,
  component: menu.component ?? null,
  menuType: menu.menuType ?? 0,
  sortNumber: menu.sortNumber ?? 0,
  authority: menu.authority ?? null,
  icon: menu.icon ?? null,
  hide: menu.hide ?? 0,
  meta: menu.meta ?? null,
  openType: menu.openType ?? null,
  createTime: menu.createdAt,
  updateTime: menu.updatedAt,
  children: null,
  checked: menu.checked ?? null
});

const getMenus = async (req, res, next) => {
  try {
    const { title, path, authority, parentId } = req.query;

    const query = {};
    if (title) query.title = new RegExp(title, 'i');
    if (path) query.path = new RegExp(path, 'i');
    if (authority) query.authority = authority;
    if (parentId !== undefined) query.parentId = Number(parentId);

    const menus = await Menu.find(query)
      .sort({ sortNumber: 1, createdAt: -1 })
      .lean();

    return response.success(res, menus.map(formatMenu));
  } catch (error) {
    next(error);
  }
};

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
const getMenuById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const menu = await Menu.findById(id).lean();

    if (!menu) {
      return response.notFound(res, '菜单不存在');
    }

    return response.success(res, formatMenu(menu));
  } catch (error) {
    next(error);
  }
};

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
const createMenu = async (req, res, next) => {
  try {
    const { title, menuType, path, parentId, sortNumber, icon, hide, component, redirect, authority, meta, openType, checked } = req.body;

    // 检查同一父级下是否已存在相同的排序值
    if (sortNumber !== undefined && sortNumber !== null) {
      const existingMenu = await Menu.findOne({
        parentId: parentId ?? '0',
        sortNumber
      });

      if (existingMenu) {
        return response.badRequest(res, `排序值 ${sortNumber} 在当前层级已被使用，请选择其他排序值`);
      }
    }

    const menu = await Menu.create({ title, menuType, path, parentId, sortNumber, icon, hide, component, redirect, authority, meta, openType, checked });

    // 自动将新菜单分配给所有超级管理员角色
    await Role.updateMany(
      { roleCode: 'ADMIN' },
      { $addToSet: { menus: menu._id } }
    );

    return response.created(res, formatMenu(menu.toObject()), '菜单创建成功');
  } catch (error) {
    next(error);
  }
};

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
const updateMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, menuType, path, parentId, sortNumber, icon, hide, component, redirect, authority, meta, openType, checked } = req.body;

    const menu = await Menu.findById(id);
    if (!menu) return response.notFound(res, '菜单不存在');

    // 检查同一父级下是否已存在相同的排序值（排除自己）
    const targetParentId = parentId !== undefined ? parentId : menu.parentId;
    const targetSortNumber = sortNumber !== undefined ? sortNumber : menu.sortNumber;

    if (sortNumber !== undefined || parentId !== undefined) {
      const existingMenu = await Menu.findOne({
        _id: { $ne: id },
        parentId: targetParentId,
        sortNumber: targetSortNumber
      });

      if (existingMenu) {
        return response.badRequest(res, `排序值 ${targetSortNumber} 在当前层级已被使用，请选择其他排序值`);
      }
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (menuType !== undefined) updates.menuType = menuType;
    if (path !== undefined) updates.path = path;
    if (parentId !== undefined) updates.parentId = parentId;
    if (sortNumber !== undefined) updates.sortNumber = sortNumber;
    if (icon !== undefined) updates.icon = icon;
    if (hide !== undefined) updates.hide = hide;
    if (component !== undefined) updates.component = component;
    if (redirect !== undefined) updates.redirect = redirect;
    if (authority !== undefined) updates.authority = authority;
    if (meta !== undefined) updates.meta = meta;
    if (openType !== undefined) updates.openType = openType;
    if (checked !== undefined) updates.checked = checked;

    const updated = await Menu.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
    return response.success(res, formatMenu(updated), '菜单更新成功');
  } catch (error) {
    next(error);
  }
};

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
const deleteMenu = async (req, res, next) => {
  try {
    const { id } = req.params;

    const menu = await Menu.findById(id);
    if (!menu) {
      return response.notFound(res, '菜单不存在');
    }

    const childMenus = await Menu.find({ parentId: id });
    if (childMenus.length > 0) {
      return response.badRequest(res, '存在子菜单，无法删除');
    }

    await Menu.findByIdAndDelete(id);

    // 自动从所有角色的权限列表中移除该菜单
    await Role.updateMany(
      {},
      { $pull: { menus: id } }
    );

    return response.success(res, null, '菜单删除成功');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu
};
