const mongoose = require('mongoose');
const { config } = require('../config');

const operationLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  // 全链路追踪 ID，串联 access log / error log / operation log
  traceId: { type: String, trim: true, index: true },
  module: { type: String, trim: true, maxlength: 50, index: true },
  description: { type: String, trim: true, maxlength: 100 },
  // 业务类型: INSERT 新增, UPDATE 修改, DELETE 删除, GRANT 授权, EXPORT 导出, IMPORT 导入, CLEAN 清理, OTHER 其他
  businessType: {
    type: String,
    enum: ['INSERT', 'UPDATE', 'DELETE', 'GRANT', 'EXPORT', 'IMPORT', 'CLEAN', 'OTHER'],
    default: 'OTHER',
    index: true
  },
  url: { type: String, trim: true },
  requestMethod: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
  method: { type: String, trim: true },
  params: { type: String },
  result: { type: String },
  error: { type: String },
  spendTime: { type: Number },
  os: { type: String, trim: true },
  device: { type: String, trim: true },
  browser: { type: String, trim: true },
  ip: { type: String, trim: true },
  // IP 归属地，如 "中国 北京" / "内网IP" / "未知"
  location: { type: String, trim: true },
  // 0成功, 1异常
  status: { type: Number, enum: [0, 1], default: 0 }
}, { timestamps: true });

// TTL：按 config.log.retentionDays 自动过期
operationLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: config.log.retentionDays * 24 * 60 * 60 }
);
operationLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('OperationLog', operationLogSchema);
