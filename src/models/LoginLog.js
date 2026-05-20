const mongoose = require('mongoose');
const { config } = require('../config');

const loginLogSchema = new mongoose.Schema({
  username: { type: String, trim: true, index: true },
  nickname: { type: String, trim: true },
  os: { type: String, trim: true },
  device: { type: String, trim: true },
  browser: { type: String, trim: true },
  ip: { type: String, trim: true },
  // IP 归属地
  location: { type: String, trim: true },
  // 0登录成功, 1登录失败, 2退出登录, 3续签token
  loginType: { type: Number, enum: [0, 1, 2, 3], default: 0 },
  comments: { type: String, trim: true }
}, { timestamps: true });

// TTL：按 config.log.retentionDays 自动过期
loginLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: config.log.retentionDays * 24 * 60 * 60 }
);

module.exports = mongoose.model('LoginLog', loginLogSchema);
