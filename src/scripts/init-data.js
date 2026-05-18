require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

    const roles = await createRoles();
    const menus = await createMenus();
    const organizations = await createOrganizations();
    const dictionaries = await createDictionaries();

    await createUsers(roles, organizations);

    logger.info('Data initialization completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Data initialization failed:', error);
    process.exit(1);
  }
};

const clearExistingData = async () => {
  await User.deleteMany({});
  await Role.deleteMany({});
  await Menu.deleteMany({});
  await Organization.deleteMany({});
  await Dictionary.deleteMany({});
  await DictionaryItem.deleteMany({});
  logger.info('Existing data cleared');
};

const createRoles = async () => {
  const roles = await Role.insertMany([
    {
      name: '管理员',
      code: 'ADMIN',
      remark: '系统管理员，拥有所有权限',
      permissions: [],
      status: 'active'
    },
    {
      name: '普通用户',
      code: 'USER',
      remark: '普通用户，拥有基础权限',
      permissions: [],
      status: 'active'
    },
    {
      name: '游客',
      code: 'GUEST',
      remark: '访客，仅有查看权限',
      permissions: [],
      status: 'active'
    }
  ]);
  logger.info(`Created ${roles.length} roles`);
  return roles;
};

const createMenus = async () => {
  const systemMenu = await Menu.create({
    name: '系统管理',
    type: 'directory',
    path: '/system',
    sort: 1,
    visible: true
  });

  const userMenu = await Menu.create({
    name: '用户管理',
    type: 'menu',
    path: '/system/user',
    parentId: systemMenu._id,
    sort: 1,
    icon: 'user',
    visible: true,
    component: '/system/user/index'
  });

  const roleMenu = await Menu.create({
    name: '角色管理',
    type: 'menu',
    path: '/system/role',
    parentId: systemMenu._id,
    sort: 2,
    icon: 'role',
    visible: true,
    component: '/system/role/index'
  });

  const menuMenu = await Menu.create({
    name: '菜单管理',
    type: 'menu',
    path: '/system/menu',
    parentId: systemMenu._id,
    sort: 3,
    icon: 'menu',
    visible: true,
    component: '/system/menu/index'
  });

  const orgMenu = await Menu.create({
    name: '机构管理',
    type: 'menu',
    path: '/system/organization',
    parentId: systemMenu._id,
    sort: 4,
    icon: 'organization',
    visible: true,
    component: '/system/organization/index'
  });

  const dictMenu = await Menu.create({
    name: '字典管理',
    type: 'menu',
    path: '/system/dictionary',
    parentId: systemMenu._id,
    sort: 5,
    icon: 'dictionary',
    visible: true,
    component: '/system/dictionary/index'
  });

  const fileMenu = await Menu.create({
    name: '文件管理',
    type: 'menu',
    path: '/system/file',
    parentId: systemMenu._id,
    sort: 6,
    icon: 'file',
    visible: true,
    component: '/system/file/index'
  });

  const loginLogMenu = await Menu.create({
    name: '登录日志',
    type: 'menu',
    path: '/system/login-record',
    parentId: systemMenu._id,
    sort: 7,
    icon: 'login-log',
    visible: true,
    component: '/system/login-record/index'
  });

  const operationLogMenu = await Menu.create({
    name: '操作日志',
    type: 'menu',
    path: '/system/operation-record',
    parentId: systemMenu._id,
    sort: 8,
    icon: 'operation-log',
    visible: true,
    component: '/system/operation-record/index'
  });

  await Role.findByIdAndUpdate((await Role.findOne({ code: 'ADMIN' }))._id, {
    permissions: [userMenu._id, roleMenu._id, menuMenu._id, orgMenu._id, dictMenu._id, fileMenu._id, loginLogMenu._id, operationLogMenu._id]
  });

  logger.info('Created system management menus');
  return [systemMenu, userMenu, roleMenu, menuMenu, orgMenu, dictMenu, fileMenu, loginLogMenu, operationLogMenu];
};

const createOrganizations = async () => {
  const company = await Organization.create({
    organizationName: '总公司',
    organizationType: 'company',
    sortNumber: 1
  });

  const techDept = await Organization.create({
    organizationName: '技术部',
    organizationType: 'department',
    parentId: company._id.toString(),
    sortNumber: 1
  });

  const devTeam = await Organization.create({
    organizationName: '开发组',
    organizationType: 'team',
    parentId: techDept._id.toString(),
    sortNumber: 1
  });

  logger.info('Created organization structure');
  return [company, techDept, devTeam];
};

const createDictionaries = async () => {
  const sexDict = await Dictionary.create({
    dictName: '用户性别',
    dictCode: 'sex',
    sortNumber: 1
  });

  await DictionaryItem.insertMany([
    { dictId: sexDict._id, dictCode: 'sex', dictDataName: '男', dictDataCode: '1', sortNumber: 1 },
    { dictId: sexDict._id, dictCode: 'sex', dictDataName: '女', dictDataCode: '2', sortNumber: 2 }
  ]);

  const orgTypeDict = await Dictionary.create({
    dictName: '机构类型',
    dictCode: 'organization_type',
    sortNumber: 2
  });

  await DictionaryItem.insertMany([
    { dictId: orgTypeDict._id, dictCode: 'organization_type', dictDataName: '公司', dictDataCode: '1', sortNumber: 1 },
    { dictId: orgTypeDict._id, dictCode: 'organization_type', dictDataName: '部门', dictDataCode: '2', sortNumber: 2 },
    { dictId: orgTypeDict._id, dictCode: 'organization_type', dictDataName: '小组', dictDataCode: '3', sortNumber: 3 }
  ]);

  const statusDict = await Dictionary.create({
    dictName: '状态',
    dictCode: 'status',
    sortNumber: 3
  });

  await DictionaryItem.insertMany([
    { dictId: statusDict._id, dictCode: 'status', dictDataName: '正常', dictDataCode: '1', sortNumber: 1 },
    { dictId: statusDict._id, dictCode: 'status', dictDataName: '停用', dictDataCode: '2', sortNumber: 2 },
    { dictId: statusDict._id, dictCode: 'status', dictDataName: '锁定', dictDataCode: '3', sortNumber: 3 }
  ]);

  logger.info('Created dictionaries and items');
  return [sexDict, orgTypeDict, statusDict];
};

const createUsers = async (roles, organizations) => {
  const adminRole = roles.find(r => r.code === 'ADMIN');
  const userRole = roles.find(r => r.code === 'USER');
  const guestRole = roles.find(r => r.code === 'GUEST');
  const devTeam = organizations.find(o => o.organizationName === '开发组');

  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedTestPassword = await bcrypt.hash('test123', 10);
  const hashedGuestPassword = await bcrypt.hash('guest123', 10);

  await User.insertMany([
    {
      username: 'admin',
      name: '管理员',
      sex: 'unknown',
      email: 'admin@example.com',
      phone: '13800138000',
      password: hashedAdminPassword,
      status: 'active',
      remark: '系统管理员账号',
      organization: devTeam ? devTeam._id : null,
      roles: [adminRole._id]
    },
    {
      username: 'testuser',
      name: '测试用户',
      sex: 'male',
      email: 'test@example.com',
      phone: '13800138001',
      password: hashedTestPassword,
      status: 'active',
      remark: '测试用户账号',
      organization: devTeam ? devTeam._id : null,
      roles: [userRole._id]
    },
    {
      username: 'guestuser',
      name: '访客用户',
      sex: 'female',
      email: 'guest@example.com',
      phone: '13800138002',
      password: hashedGuestPassword,
      status: 'active',
      remark: '访客账号',
      organization: devTeam ? devTeam._id : null,
      roles: [guestRole._id]
    }
  ]);

  logger.info('Created users: admin, testuser, guestuser');
};

initData();
