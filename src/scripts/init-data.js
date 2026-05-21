require('dotenv').config();
const mongoose = require('mongoose');
const { config, logger } = require('../config');
const User = require('../models/User');
const Role = require('../models/Role');
const Menu = require('../models/Menu');
const Organization = require('../models/Organization');
const Dictionary = require('../models/Dictionary');
const DictionaryItem = require('../models/DictionaryItem');

const initData = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    logger.info('MongoDB connected for data initialization');

    await clearExistingData();

    const organizations = await createOrganizations();
    await createDictionaries();
    const menus = await createMenus();
    const roles = await createRoles(menus);
    await createUsers(roles, organizations);

    logger.info('Data initialization completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Data initialization failed:', error);
    process.exit(1);
  }
};

const clearExistingData = async () => {
  await Promise.all([
    User.deleteMany({}),
    Role.deleteMany({}),
    Menu.deleteMany({}),
    Organization.deleteMany({}),
    Dictionary.deleteMany({}),
    DictionaryItem.deleteMany({})
  ]);
  logger.info('Existing data cleared');
};

const createOrganizations = async () => {
  const company = await Organization.create({
    organizationName: '总公司',
    organizationType: '1',
    organizationFullName: '总公司',
    organizationTypeName: '公司',
    sortNumber: 1
  });

  const techDept = await Organization.create({
    organizationName: '技术部',
    organizationType: '2',
    organizationTypeName: '部门',
    organizationFullName: '总公司部门-技术部',
    parentId: company._id.toString(),
    sortNumber: 2
  });

  const devTeam = await Organization.create({
    organizationName: '开发组',
    organizationType: '3',
    organizationTypeName: '小组',
    organizationFullName: '总公司部门-技术部-开发组',
    parentId: techDept._id.toString(),
    sortNumber: 3
  });

  logger.info('Created organization structure');
  return { company, techDept, devTeam };
};

const createDictionaries = async () => {
  const sexDict = await Dictionary.create({ dictName: '用户性别', dictCode: 'sex', sortNumber: 1 });
  await DictionaryItem.insertMany([
    { dictId: sexDict._id, dictCode: 'sex', dictDataName: '男', dictDataCode: '1', sortNumber: 1 },
    { dictId: sexDict._id, dictCode: 'sex', dictDataName: '女', dictDataCode: '2', sortNumber: 2 }
  ]);

  const orgTypeDict = await Dictionary.create({ dictName: '机构类型', dictCode: 'organization_type', sortNumber: 2 });
  await DictionaryItem.insertMany([
    { dictId: orgTypeDict._id, dictCode: 'organization_type', dictDataName: '公司', dictDataCode: '1', sortNumber: 1 },
    { dictId: orgTypeDict._id, dictCode: 'organization_type', dictDataName: '部门', dictDataCode: '2', sortNumber: 2 },
    { dictId: orgTypeDict._id, dictCode: 'organization_type', dictDataName: '小组', dictDataCode: '3', sortNumber: 3 }
  ]);

  const statusDict = await Dictionary.create({ dictName: '状态', dictCode: 'status', sortNumber: 3 });
  await DictionaryItem.insertMany([
    { dictId: statusDict._id, dictCode: 'status', dictDataName: '正常', dictDataCode: '0', sortNumber: 1 },
    { dictId: statusDict._id, dictCode: 'status', dictDataName: '冻结', dictDataCode: '1', sortNumber: 2 }
  ]);

  logger.info('Created dictionaries and items');
};

const createMenus = async () => {
  const dashboardMenu = await Menu.create({
    title: 'Dashboard',
    menuType: 0,
    path: '/dashboard',
    parentId: '0',
    sortNumber: 0,
    icon: 'HomeOutlined',
    hide: 0,
    openType: 0
  });

  const systemMenu = await Menu.create({
    title: '系统管理',
    menuType: 0,
    path: '/system',
    parentId: '0',
    sortNumber: 1,
    icon: 'SettingOutlined',
    hide: 0,
    openType: 0,
    meta: '{"lang":{"zh_TW":"系統管理","en":"System"}}'
  });

  const personalMenu = await Menu.create({
    title: '个人中心',
    menuType: 0,
    path: '/user',
    parentId: '0',
    sortNumber: 2,
    icon: 'ControlOutlined',
    hide: 0,
    openType: 0,
    meta: '{"lang":{"zh_TW":"個人中心","en":"User"}}'
  });

  const pid = systemMenu._id.toString();
  const dashboardPid = dashboardMenu._id.toString();
  const personalPid = personalMenu._id.toString();

  const [workplaceMenu] = await Menu.insertMany([
    { title: '工作台', menuType: 1, path: '/dashboard/workplace', parentId: dashboardPid, sortNumber: 1, icon: 'DesktopOutlined', hide: 0, openType: 0, component: '/dashboard/workplace', meta: '{"lang":{"zh_TW":"工作臺","en":"Workplace"}}' }
  ]);

  const [profileMenu, messageMenu] = await Menu.insertMany([
    { title: '我的资料', menuType: 1, path: '/user/profile',             parentId: personalPid, sortNumber: 1, icon: 'UserOutlined',     hide: 0, openType: 0, component: '/user/profile', meta: '{"lang":{"zh_TW":"個人資料","en":"Profile"}}' },
    { title: '我的消息', menuType: 1, path: '/user/message',             parentId: personalPid, sortNumber: 2, icon: 'MessageOutlined',   hide: 0, openType: 0, component: '/user/message', meta: '{"lang":{"zh_TW":"我的消息","en":"Message"}}' }
  ]);

  const [userMenu, roleMenu, menuMenu, orgMenu, dictMenu, fileMenu, loginLogMenu, operationLogMenu] =
    await Menu.insertMany([
      { title: '用户管理', menuType: 1, path: '/system/user',             parentId: pid, sortNumber: 1, icon: 'UserOutlined',     hide: 0, openType: 0, component: '/system/user', meta: '{"lang":{"zh_TW":"用戶管理","en":"User"}}' },
      { title: '角色管理', menuType: 1, path: '/system/role',             parentId: pid, sortNumber: 2, icon: 'IdcardOutlined',   hide: 0, openType: 0, component: '/system/role', meta: '{"lang":{"zh_TW":"角色管理","en":"Role"}}' },
      { title: '菜单管理', menuType: 1, path: '/system/menu',             parentId: pid, sortNumber: 3, icon: 'AppstoreOutlined', hide: 0, openType: 0, component: '/system/menu', meta: '{"lang":{"zh_TW":"選單管理","en":"Menu"}}' },
      { title: '机构管理', menuType: 1, path: '/system/organization',     parentId: pid, sortNumber: 4, icon: 'CityOutlined',     hide: 0, openType: 0, component: '/system/organization', meta: '{"lang":{"zh_TW":"機构管理","en":"Organization"}}' },
      { title: '字典管理', menuType: 1, path: '/system/dictionary',       parentId: pid, sortNumber: 5, icon: 'BookOutlined',     hide: 0, openType: 0, component: '/system/dictionary', meta: '{"hideFooter":true,"lang":{"zh_TW":"字典管理","en":"Dictionary"}}' },
      { title: '文件管理', menuType: 1, path: '/system/file',             parentId: pid, sortNumber: 6, icon: 'FolderOutlined',   hide: 0, openType: 0, component: '/system/file', meta: '{"lang":{"zh_TW":"檔案管理","en":"File"}}' },
      { title: '登录日志', menuType: 1, path: '/system/login-record',     parentId: pid, sortNumber: 7, icon: 'CalendarOutlined', hide: 0, openType: 0, component: '/system/login-record', meta: '{"lang":{"zh_TW":"登入日誌","en":"LoginRecord"}}' },
      { title: '操作日志', menuType: 1, path: '/system/operation-record', parentId: pid, sortNumber: 8, icon: 'LogOutlined',      hide: 0, openType: 0, component: '/system/operation-record', meta: '{"lang":{"zh_TW":"操作日誌","en":"OperationRecord"}}' }
    ]);

  // 按钮级菜单（menuType: 2），authority 供前端权限指令使用
  const buttons = await Menu.insertMany([
    // 用户管理
    { title: '查询用户',   menuType: 2, openType: 0, parentId: userMenu._id.toString(),      sortNumber: 1, authority: 'sys:user:list' },
    { title: '添加用户',   menuType: 2, openType: 0, parentId: userMenu._id.toString(),      sortNumber: 2, authority: 'sys:user:save' },
    { title: '修改用户',   menuType: 2, openType: 0, parentId: userMenu._id.toString(),      sortNumber: 3, authority: 'sys:user:update' },
    { title: '删除用户',   menuType: 2, openType: 0, parentId: userMenu._id.toString(),      sortNumber: 4, authority: 'sys:user:remove' },
    { title: '用户详情',   menuType: 1, openType: 0, path: '/system/user/details/:id', parentId: userMenu._id.toString(),      sortNumber: 4, icon: 'UserOutlined', hide: 1, component: '/system/user/details' },
    // 角色管理
    { title: '查询角色',   menuType: 2, openType: 0, parentId: roleMenu._id.toString(),      sortNumber: 1, authority: 'sys:role:list' },
    { title: '添加角色',   menuType: 2, openType: 0, parentId: roleMenu._id.toString(),      sortNumber: 2, authority: 'sys:role:save' },
    { title: '修改角色',   menuType: 2, openType: 0, parentId: roleMenu._id.toString(),      sortNumber: 3, authority: 'sys:role:update' },
    { title: '删除角色',   menuType: 2, openType: 0, parentId: roleMenu._id.toString(),      sortNumber: 4, authority: 'sys:role:remove' },
    // 菜单管理
    { title: '查询菜单',   menuType: 2, openType: 0, parentId: menuMenu._id.toString(),      sortNumber: 1, authority: 'sys:menu:list' },
    { title: '添加菜单',   menuType: 2, openType: 0, parentId: menuMenu._id.toString(),      sortNumber: 2, authority: 'sys:menu:save' },
    { title: '修改菜单',   menuType: 2, openType: 0, parentId: menuMenu._id.toString(),      sortNumber: 3, authority: 'sys:menu:update' },
    { title: '删除菜单',   menuType: 2, openType: 0, parentId: menuMenu._id.toString(),      sortNumber: 4, authority: 'sys:menu:remove' },
    // 机构管理
    { title: '查询机构',   menuType: 2, openType: 0, parentId: orgMenu._id.toString(),       sortNumber: 1, authority: 'sys:org:list' },
    { title: '添加机构',   menuType: 2, openType: 0, parentId: orgMenu._id.toString(),       sortNumber: 2, authority: 'sys:org:save' },
    { title: '修改机构',   menuType: 2, openType: 0, parentId: orgMenu._id.toString(),       sortNumber: 3, authority: 'sys:org:update' },
    { title: '删除机构',   menuType: 2, openType: 0, parentId: orgMenu._id.toString(),       sortNumber: 4, authority: 'sys:org:remove' },
    // 字典管理
    { title: '查询字典',   menuType: 2, openType: 0, parentId: dictMenu._id.toString(),      sortNumber: 1, authority: 'sys:dict:list' },
    { title: '添加字典',   menuType: 2, openType: 0, parentId: dictMenu._id.toString(),      sortNumber: 2, authority: 'sys:dict:save' },
    { title: '修改字典',   menuType: 2, openType: 0, parentId: dictMenu._id.toString(),      sortNumber: 3, authority: 'sys:dict:update' },
    { title: '删除字典',   menuType: 2, openType: 0, parentId: dictMenu._id.toString(),      sortNumber: 4, authority: 'sys:dict:remove' },
    // 文件管理
    { title: '上传文件',   menuType: 2, openType: 0, parentId: fileMenu._id.toString(),      sortNumber: 2, authority: 'sys:file:upload' },
    { title: '删除文件',   menuType: 2, openType: 0, parentId: fileMenu._id.toString(),      sortNumber: 4, authority: 'sys:file:remove' },
    { title: '查看记录',   menuType: 2, openType: 0, parentId: fileMenu._id.toString(),      sortNumber: 3, authority: 'sys:file:list' },
  ]);

  logger.info(`Created menus (${14 + buttons.length} total)`);
  return { dashboardMenu, workplaceMenu, personalMenu, profileMenu, messageMenu, systemMenu, userMenu, roleMenu, menuMenu, orgMenu, dictMenu, fileMenu, loginLogMenu, operationLogMenu, buttons };
};

const createRoles = async (menus) => {
  const pageMenuIds = [
    menus.dashboardMenu._id, menus.workplaceMenu._id, menus.systemMenu._id,
    menus.personalMenu._id, menus.profileMenu._id, menus.messageMenu._id,
    menus.userMenu._id, menus.roleMenu._id, menus.menuMenu._id,
    menus.orgMenu._id, menus.dictMenu._id, menus.fileMenu._id,
    menus.loginLogMenu._id, menus.operationLogMenu._id
  ];
  const buttonIds = menus.buttons.map(b => b._id);
  const allMenuIds = [...pageMenuIds, ...buttonIds];

  const [admin, user, guest] = await Role.insertMany([
    { roleName: '管理员', roleCode: 'ADMIN', comments: '系统管理员，拥有所有权限', menus: allMenuIds },
    { roleName: '普通用户', roleCode: 'USER',  comments: '普通用户，拥有基础权限', menus: [menus.systemMenu._id, menus.userMenu._id] },
    { roleName: '游客',   roleCode: 'GUEST', comments: '访客，仅有查看权限',     menus: [menus.systemMenu._id] }
  ]);

  logger.info('Created roles');
  return { admin, user, guest };
};

const createUsers = async (roles, organizations) => {
  // 密码由 User.pre('save') 钩子自动 bcrypt 哈希，不需要手动 hash
  const users = [
    {
      username: 'admin',
      nickname: '管理员',
      email: 'admin@example.com',
      phone: '13800138000',
      password: 'admin123',
      avatar: 'https://ck-bkt-knowledge-payment.oss-cn-hangzhou.aliyuncs.com/admin/material/9_material_admin/image/assets/i/wap/fashou/no_login_head.png',
      status: 0,
      comments: '系统管理员账号',
      organizationId: organizations.devTeam._id,
      roles: [roles.admin._id]
    },
    {
      username: 'testuser',
      nickname: '测试用户',
      sex: '1',
      email: 'test@example.com',
      phone: '13800138001',
      password: 'test123',
      avatar: 'https://ck-bkt-knowledge-payment.oss-cn-hangzhou.aliyuncs.com/admin/material/9_material_admin/image/assets/i/wap/fashou/no_login_head.png',
      status: 0,
      comments: '测试用户账号',
      organizationId: organizations.devTeam._id,
      roles: [roles.user._id]
    },
    {
      username: 'guestuser',
      nickname: '访客用户',
      sex: '2',
      email: 'guest@example.com',
      phone: '13800138002',
      password: 'guest123',
      avatar: 'https://ck-bkt-knowledge-payment.oss-cn-hangzhou.aliyuncs.com/admin/material/9_material_admin/image/assets/i/wap/fashou/no_login_head.png',
      status: 0,
      comments: '访客账号',
      organizationId: organizations.devTeam._id,
      roles: [roles.guest._id]
    }
  ];

  // insertMany 不触发 pre('save') 钩子，需逐条 save 以触发密码哈希
  for (const data of users) {
    await new User(data).save();
  }

  logger.info('Created users: admin, testuser, guestuser');
};

initData();
