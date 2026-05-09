const mongoose = require('mongoose');

const operationLogSchema = new mongoose.Schema({
  module: {
    type: String,
    trim: true,
    maxlength: 50,
    index: true
  },
  function: {
    type: String,
    trim: true,
    maxlength: 100
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    required: true
  },
  params: {
    type: mongoose.Schema.Types.Mixed
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  duration: {
    type: Number
  },
  status: {
    type: String,
    enum: ['success', 'fail'],
    default: 'success'
  },
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  operationTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  ip: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

operationLogSchema.index({ operationTime: 1 }, { expireAfterSeconds: 2592000 });
operationLogSchema.index({ operator: 1, operationTime: -1 });

module.exports = mongoose.model('OperationLog', operationLogSchema);
