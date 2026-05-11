const User = require('../models/User');
const response = require('../utils/response');

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, username, name, status, organization, sortField = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};

    if (username) query.username = new RegExp(username, 'i');
    if (name) query.name = new RegExp(name, 'i');
    if (status) query.status = status;
    if (organization) query.organization = organization;

    const limit = Math.min(parseInt(pageSize, 10) || 20, 100);
    const skip = (parseInt(page, 10) - 1) * limit;

    const sortObj = {};
    sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;

    const [list, total] = await Promise.all([
      User.find(query)
        .populate('organization', 'name')
        .populate('roles', 'name code')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    return response.paginated(res, { list, total, page, pageSize });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .populate('organization', 'name type')
      .populate('roles', 'name code permissions')
      .lean();

    if (!user) {
      return response.notFound(res, '用户不存在');
    }

    return response.success(res, user);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { username, name, sex, email, phone, birthday, password, status, remark, organization, roles } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return response.badRequest(res, '用户名已存在');
    }

    const user = await User.create({
      username,
      name,
      sex,
      email,
      phone,
      birthday,
      password,
      status,
      remark,
      organization,
      roles
    });

    const populatedUser = await User.findById(user._id)
      .populate('organization', 'name')
      .populate('roles', 'name code')
      .lean();

    return response.created(res, populatedUser, '用户创建成功');
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, sex, email, phone, birthday, status, remark, organization, roles } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return response.notFound(res, '用户不存在');
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (sex !== undefined) updates.sex = sex;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (birthday !== undefined) updates.birthday = birthday;
    if (status !== undefined) updates.status = status;
    if (remark !== undefined) updates.remark = remark;
    if (organization !== undefined) updates.organization = organization;
    if (roles !== undefined) updates.roles = roles;

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('organization', 'name')
      .populate('roles', 'name code')
      .lean();

    return response.success(res, updatedUser, '用户更新成功');
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return response.notFound(res, '用户不存在');
    }

    return response.success(res, null, '用户删除成功');
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'locked'].includes(status)) {
      return response.badRequest(res, '无效的状态值');
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
    if (!user) {
      return response.notFound(res, '用户不存在');
    }

    return response.success(res, null, '状态更新成功');
  } catch (error) {
    next(error);
  }
};

const updateUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const isAdmin = req.user.roles.some(r => r.code === 'ADMIN');
    if (!isAdmin && req.user._id.toString() !== id) {
      return response.forbidden(res, '只能修改自己的密码');
    }

    if (!password || password.length < 6) {
      return response.badRequest(res, '密码长度不能少于6位');
    }

    const user = await User.findById(id);
    if (!user) {
      return response.notFound(res, '用户不存在');
    }

    user.password = password;
    await user.save();

    return response.success(res, null, '密码修改成功');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  updateUserPassword
};
