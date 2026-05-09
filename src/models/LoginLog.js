const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  loginTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  ip: {
    type: String,
    trim: true
  },
  device: {
    type: String,
    trim: true
  },
  os: {
    type: String,
    trim: true
  },
  browser: {
    type: String,
    trim: true
  },
  loginType: {
    type: String,
    enum: ['login_success', 'login_fail', 'refresh_token'],
    default: 'login_success'
  },
  status: {
    type: String,
    enum: ['success', 'fail'],
    default: 'success'
  }
}, {
  timestamps: true
});

loginLogSchema.index({ loginTime: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('LoginLog', loginLogSchema);
