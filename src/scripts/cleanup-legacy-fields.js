require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { config } = require('../config');

const DANGLING_ORG_ID = '6a06bfdcef06dac2aebc89ca';
const USER_LEGACY_FIELDS = ['name', 'remark', 'organization'];
const ROLE_LEGACY_FIELDS = ['name', 'code', 'remark', 'permissions', 'status'];
const BACKUP_DIR = path.join(__dirname, '..', '..', 'backup');

const main = async () => {
  await mongoose.connect(config.mongodb.uri);
  const db = mongoose.connection.db;
  console.log('[cleanup] connected to', config.mongodb.uri);

  // 1) 收集受影响文档
  const userLegacyFilter = { $or: USER_LEGACY_FIELDS.map(k => ({ [k]: { $exists: true } })) };
  const danglingOrgFilter = { organizationId: new mongoose.Types.ObjectId(DANGLING_ORG_ID) };
  const affectedUsers = await db.collection('users').find({ $or: [userLegacyFilter, danglingOrgFilter] }).toArray();

  const roleLegacyFilter = { $or: ROLE_LEGACY_FIELDS.map(k => ({ [k]: { $exists: true } })) };
  const affectedRoles = await db.collection('roles').find(roleLegacyFilter).toArray();

  console.log(`[cleanup] affected users: ${affectedUsers.length}`);
  affectedUsers.forEach(u => console.log('  -', u.username, u._id.toString()));
  console.log(`[cleanup] affected roles: ${affectedRoles.length}`);
  affectedRoles.forEach(r => console.log('  -', r.roleCode || r.code, r._id.toString()));

  if (affectedUsers.length === 0 && affectedRoles.length === 0) {
    console.log('[cleanup] nothing to clean. exit.');
    process.exit(0);
  }

  // 2) 备份
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `cleanup-${ts}.json`);
  fs.writeFileSync(backupFile, JSON.stringify({
    danglingOrgId: DANGLING_ORG_ID,
    userLegacyFields: USER_LEGACY_FIELDS,
    roleLegacyFields: ROLE_LEGACY_FIELDS,
    users: affectedUsers,
    roles: affectedRoles
  }, null, 2));
  console.log('[cleanup] backup written:', backupFile);

  // 3) 用户：删除旧字段
  const unsetUser = USER_LEGACY_FIELDS.reduce((acc, k) => { acc[k] = ''; return acc; }, {});
  const r1 = await db.collection('users').updateMany(userLegacyFilter, { $unset: unsetUser });
  console.log(`[cleanup] users.$unset legacy fields → matched=${r1.matchedCount}, modified=${r1.modifiedCount}`);

  // 4) 用户：悬挂 organizationId → null
  const r2 = await db.collection('users').updateMany(danglingOrgFilter, { $set: { organizationId: null } });
  console.log(`[cleanup] users dangling orgId → null: matched=${r2.matchedCount}, modified=${r2.modifiedCount}`);

  // 5) 角色：删除旧字段
  const unsetRole = ROLE_LEGACY_FIELDS.reduce((acc, k) => { acc[k] = ''; return acc; }, {});
  const r3 = await db.collection('roles').updateMany(roleLegacyFilter, { $unset: unsetRole });
  console.log(`[cleanup] roles.$unset legacy fields → matched=${r3.matchedCount}, modified=${r3.modifiedCount}`);

  // 6) 验证
  const remainUserLegacy = await db.collection('users').countDocuments(userLegacyFilter);
  const remainDangling = await db.collection('users').countDocuments(danglingOrgFilter);
  const remainRoleLegacy = await db.collection('roles').countDocuments(roleLegacyFilter);
  console.log('[cleanup] post-check →',
    'user legacy remaining:', remainUserLegacy,
    '| dangling orgId remaining:', remainDangling,
    '| role legacy remaining:', remainRoleLegacy);

  if (remainUserLegacy + remainDangling + remainRoleLegacy === 0) {
    console.log('[cleanup] SUCCESS — all dirty data cleared.');
  } else {
    console.log('[cleanup] WARNING — some dirty data remains.');
  }

  await mongoose.disconnect();
  process.exit(0);
};

main().catch(e => {
  console.error('[cleanup] FAILED:', e);
  process.exit(1);
});
