const Menu = require('../models/Menu');
const response = require('../utils/response');

const getMenus = async (req, res, next) => {
  try {
    const { type, visible, name } = req.query;

    const query = {};

    if (type) query.type = type;
    if (visible !== undefined) query.visible = visible === 'true';
    if (name) query.name = new RegExp(name, 'i');

    const menus = await Menu.find(query)
      .populate('parentId', 'name')
      .sort({ sort: 1, createdAt: -1 })
      .lean();

    const tree = buildMenuTree(menus);

    return response.success(res, tree);
  } catch (error) {
    next(error);
  }
};

const buildMenuTree = (menus, parentId = null) => {
  return menus
    .filter(menu => {
      if (parentId === null) {
        return menu.parentId === null || menu.parentId === undefined;
      }
      return menu.parentId && menu.parentId._id.toString() === parentId.toString();
    })
    .map(menu => ({
      ...menu,
      children: buildMenuTree(menus, menu._id)
    }))
    .sort((a, b) => a.sort - b.sort);
};

const getMenuById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const menu = await Menu.findById(id)
      .populate('parentId', 'name')
      .lean();

    if (!menu) {
      return response.notFound(res, '菜单不存在');
    }

    return response.success(res, menu);
  } catch (error) {
    next(error);
  }
};

const createMenu = async (req, res, next) => {
  try {
    const { name, type, path, parentId, sort, icon, visible, component, redirect } = req.body;

    if (parentId) {
      const parentMenu = await Menu.findById(parentId);
      if (!parentMenu) {
        return response.badRequest(res, '父菜单不存在');
      }
    }

    const menu = await Menu.create({
      name,
      type,
      path,
      parentId,
      sort,
      icon,
      visible,
      component,
      redirect
    });

    const populatedMenu = await Menu.findById(menu._id)
      .populate('parentId', 'name')
      .lean();

    return response.created(res, populatedMenu, '菜单创建成功');
  } catch (error) {
    next(error);
  }
};

const updateMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, path, parentId, sort, icon, visible, component, redirect } = req.body;

    const menu = await Menu.findById(id);
    if (!menu) {
      return response.notFound(res, '菜单不存在');
    }

    if (parentId && parentId === id) {
      return response.badRequest(res, '不能将自己设为父菜单');
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (path !== undefined) updates.path = path;
    if (parentId !== undefined) updates.parentId = parentId;
    if (sort !== undefined) updates.sort = sort;
    if (icon !== undefined) updates.icon = icon;
    if (visible !== undefined) updates.visible = visible;
    if (component !== undefined) updates.component = component;
    if (redirect !== undefined) updates.redirect = redirect;

    const updatedMenu = await Menu.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('parentId', 'name')
      .lean();

    return response.success(res, updatedMenu, '菜单更新成功');
  } catch (error) {
    next(error);
  }
};

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
