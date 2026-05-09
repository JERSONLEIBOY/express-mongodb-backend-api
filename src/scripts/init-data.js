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
    name: '总公司',
    type: 'company',
    sort: 1,
    status: 'active'
  });

  const techDept = await Organization.create({
    name: '技术部',
    type: 'department',
    parentId: company._id,
    sort: 1,
    status: 'active'
  });

  const devTeam = await Organization.create({
    name: '开发组',
    type: 'team',
    parentId: techDept._id,
    sort: 1,
    status: 'active'
  });

  logger.info('Created organization structure');
  return [company, techDept, devTeam];
};

const createDictionaries = async () => {
  const sexDict = await Dictionary.create({
    name: '性别',
    code: 'sex',
    status: 'active'
  });

  await DictionaryItem.insertMany([
    { dictionaryCode: 'sex', label: '男', value: 'male', sort: 1, status: 'active' },
    { dictionaryCode: 'sex', label: '女', value: 'female', sort: 2, status: 'active' },
    { dictionaryCode: 'sex', label: '未知', value: 'unknown', sort: 3, status: 'active' }
  ]);

  const orgTypeDict = await Dictionary.create({
    name: '机构类型',
    code: 'organization_type',
    status: 'active'
  });

  await DictionaryItem.insertMany([
    { dictionaryCode: 'organization_type', label: '公司', value: 'company', sort: 1, status: 'active' },
    { dictionaryCode: 'organization_type', label: '部门', value: 'department', sort: 2, status: 'active' },
    { dictionaryCode: 'organization_type', label: '小组', value: 'team', sort: 3, status: 'active' }
  ]);

  const statusDict = await Dictionary.create({
    name: '状态',
    code: 'status',
    status: 'active'
  });

  await DictionaryItem.insertMany([
    { dictionaryCode: 'status', label: '正常', value: 'active', sort: 1, status: 'active' },
    { dictionaryCode: 'status', label: '停用', value: 'inactive', sort: 2, status: 'active' },
    { dictionaryCode: 'status', label: '锁定', value: 'locked', sort: 3, status: 'active' }
  ]);

  logger.info('Created dictionaries and items');
  return [sexDict, orgTypeDict, statusDict];
};

const createUsers = async (roles, organizations) => {
  const adminRole = roles.find(r => r.code === 'ADMIN');
  const userRole = roles.find(r => r.code === 'USER');
  const guestRole = roles.find(r => r.code === 'GUEST');
  const devTeam = organizations.find(o => o.name === '开发组');

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
