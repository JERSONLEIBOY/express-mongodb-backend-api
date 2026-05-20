const User = require('../models/User');
const Role = require('../models/Role');
const Menu = require('../models/Menu');
const Organization = require('../models/Organization');
const DictionaryItem = require('../models/DictionaryItem');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const response = require('../utils/response');

const formatMenu = (m) => ({
  menuId: m._id,
  parentId: m.parentId ?? 0,
  title: m.title,
  path: m.path ?? null,
  component: m.component ?? null,
  menuType: m.menuType ?? 0,
  sortNumber: m.sortNumber ?? 0,
  authority: m.authority ?? null,
  icon: m.icon ?? null,
  hide: m.hide ?? 0,
  meta: m.meta ?? null,
  openType: m.openType ?? null,
  createTime: m.createdAt,
  updateTime: m.updatedAt
});

const normalizeIds = (arr) =>
  (arr || []).map(r => (typeof r === 'object' && r !== null ? r.roleId || r._id || r : r));

const formatRole = (r) => ({
  roleId: r._id,
  roleCode: r.roleCode,
  roleName: r.roleName,
  comments: r.comments ?? null,
  createTime: r.createdAt
});

const formatUser = (u, orgName) => ({
  userId: u._id,
  username: u.username,
  nickname: u.nickname ?? null,
  avatar: u.avatar ?? null,
  sex: u.sex ?? null,
  phone: u.phone ?? null,
  email: u.email ?? null,
  birthday: u.birthday ?? null,
  introduction: u.introduction ?? null,
  address: u.address ?? null,
  tellPre: u.tellPre ?? null,
  tell: u.tell ?? null,
  organizationId: u.organizationId ? (typeof u.organizationId === 'object' ? u.organizationId._id : u.organizationId) : null,
  organizationName: orgName ?? null,
  status: u.status ?? 0,
  comments: u.comments ?? null,
  createTime: u.createdAt,
  roles: (u.roles || []).map(r => typeof r === 'object' && r.roleCode ? formatRole(r) : r),
  authorities: u._authorities || []
});

const populateUser = (query) =>
  query
    .populate({ path: 'organizationId', select: 'organizationName', model: Organization })
    .populate({ path: 'roles', select: 'roleCode roleName comments createdAt', model: Role });

const buildAuthorities = async (roles) => {
  const menuIds = [...new Set(roles.flatMap(r => (r.menus || []).map(id => id.toString())))];
  if (!menuIds.length) return [];
  const menus = await Menu.find({ _id: { $in: menuIds } }).sort({ sortNumber: 1 }).lean();
  return menus.map(formatMenu);
};

const withAuthorities = async (user) => {
  const roleIds = (user.roles || []).map(r => r._id || r);
  const roles = await Role.find({ _id: { $in: roleIds } }).lean();
  user._authorities = await buildAuthorities(roles);
  return user;
};

const buildQuery = ({ username, nickname, sex, phone, status, organizationId, email, createTimeStart, createTimeEnd }) => {
  const query = {};
  if (username) query.username = new RegExp(username, 'i');
  if (nickname) query.nickname = new RegExp(nickname, 'i');
  if (sex) query.sex = sex;
  if (phone) query.phone = new RegExp(phone, 'i');
  if (email) query.email = new RegExp(email, 'i');
  if (status !== undefined && status !== '') query.status = Number(status);
  if (organizationId) query.organizationId = organizationId;
  if (createTimeStart || createTimeEnd) {
    query.createdAt = {};
    if (createTimeStart) query.createdAt.$gte = new Date(createTimeStart);
    if (createTimeEnd) query.createdAt.$lte = new Date(createTimeEnd);
  }
  return query;
};

const toUserResult = (u) => {
  const orgName = u.organizationId?.organizationName ?? null;
  return formatUser(u, orgName);
};

const getUsersPage = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, ...filters } = req.query;
    const query = buildQuery(filters);
    const skip = (Number(page) - 1) * Number(limit);
    const [list, count] = await Promise.all([
      populateUser(User.find(query)).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(query)
    ]);
    return response.success(res, { list: list.map(toUserResult), count });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const list = await populateUser(User.find(buildQuery(req.query))).sort({ createdAt: -1 }).lean();
    return response.success(res, list.map(toUserResult));
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await populateUser(User.findById(req.params.id)).lean();
    if (!user) return response.notFound(res, '用户不存在');
    await withAuthorities(user);
    return response.success(res, toUserResult(user));
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { username, nickname, avatar, sex, email, phone, birthday, introduction, address, tellPre, tell,
      password, status, comments, organizationId, roles } = req.body;
    if (await User.findOne({ username }).lean()) return response.badRequest(res, '用户名已存在');
    const user = await User.create({ username, nickname, avatar, sex, email, phone, birthday, introduction,
      address, tellPre, tell, password, status, comments, organizationId, roles: normalizeIds(roles) });
    const populated = await populateUser(User.findById(user._id)).lean();
    return response.created(res, toUserResult(populated), '用户创建成功');
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!await User.findById(id).lean()) return response.notFound(res, '用户不存在');
    const fields = ['nickname', 'avatar', 'sex', 'email', 'phone', 'birthday', 'introduction',
      'address', 'tellPre', 'tell', 'status', 'comments', 'organizationId', 'roles'];
    const updates = {};
    fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (updates.roles) updates.roles = normalizeIds(updates.roles);
    const updated = await populateUser(User.findByIdAndUpdate(id, updates, { new: true, runValidators: true })).lean();
    return response.success(res, toUserResult(updated), '用户更新成功');
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    if (!await User.findByIdAndDelete(req.params.id)) return response.notFound(res, '用户不存在');
    return response.success(res, null, '用户删除成功');
  } catch (error) {
    next(error);
  }
};

const deleteUserBatch = async (req, res, next) => {
  try {
    const ids = req.body;
    if (!Array.isArray(ids) || !ids.length) return response.badRequest(res, '请提供要删除的ids');
    await User.deleteMany({ _id: { $in: ids } });
    return response.success(res, null, '批量删除成功');
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (![0, 1].includes(Number(status))) return response.badRequest(res, '无效的状态值');
    if (!await User.findByIdAndUpdate(id, { status: Number(status) })) return response.notFound(res, '用户不存在');
    return response.success(res, null, '状态更新成功');
  } catch (error) {
    next(error);
  }
};

const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || password.length < 6) return response.badRequest(res, '密码长度不能少于6位');
    const user = await User.findById(id);
    if (!user) return response.notFound(res, '用户不存在');
    user.password = password;
    await user.save();
    return response.success(res, null, '密码重置成功');
  } catch (error) {
    next(error);
  }
};

const importUsers = async (req, res, next) => {
  try {
    if (!req.file) return response.badRequest(res, '请上传文件');
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    if (!rows.length) return response.badRequest(res, '文件内容为空');

    // 预加载字典/角色/机构，避免每行重复查询
    const sexItems = await DictionaryItem.find({ dictCode: 'sex' }).lean();
    const sexMap = Object.fromEntries(sexItems.map(i => [i.dictDataName, i.dictDataCode]));
    const allRoles = await Role.find({}).lean();
    const roleMap = Object.fromEntries(allRoles.map(r => [r.roleName, r._id]));
    const allOrgs = await Organization.find({}).lean();
    const orgMap = Object.fromEntries(allOrgs.map(o => [o.organizationName, o._id]));

    const results = { success: 0, failed: 0, errors: [] };
    for (const row of rows) {
      try {
        const username = row['登录账号'] || row['账号'] || row['username'];
        if (!username) { results.failed++; results.errors.push('缺少账号'); continue; }
        if (await User.findOne({ username }).lean()) { results.failed++; results.errors.push(`${username} 已存在`); continue; }

        const sexName = row['性别'] || row['sex'] || '';
        const roleName = row['角色'] || '';
        const orgName = row['组织机构'] || '';

        const roleId = roleMap[roleName];
        const orgId = orgMap[orgName];

        await User.create({
          username,
          nickname: row['用户名'] || row['昵称'] || row['nickname'],
          phone: String(row['手机号'] || row['phone'] || ''),
          email: row['邮箱'] || row['email'],
          sex: sexMap[sexName] || sexName,
          password: String(row['登录密码'] || row['密码'] || row['password'] || '123456'),
          organizationId: orgId || null,
          roles: roleId ? [roleId] : [],
          status: 0
        });
        results.success++;
      } catch (e) {
        results.failed++;
        results.errors.push(e.message);
      }
    }
    return response.success(res, results, `导入完成，成功${results.success}条，失败${results.failed}条`);
  } catch (error) {
    next(error);
  }
};

const checkExistence = async (req, res, next) => {
  try {
    const { field, value, id } = req.query;
    const allowedFields = ['username', 'phone', 'email'];
    if (!allowedFields.includes(field)) return response.badRequest(res, '不支持的检查字段');
    const query = { [field]: value };
    if (id) query._id = { $ne: id };
    const exists = await User.findOne(query).lean();
    if (exists) return response.badRequest(res, `${field} 已存在`);
    return response.success(res, null, `${field} 可用`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsersPage,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  deleteUserBatch,
  updateUserStatus,
  resetUserPassword,
  importUsers,
  checkExistence
};
