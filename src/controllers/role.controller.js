const Role = require('../models/Role');
const response = require('../utils/response');

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
