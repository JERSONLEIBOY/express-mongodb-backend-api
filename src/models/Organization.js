const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  organizationName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  organizationFullName: {
    type: String,
    trim: true
  },
  organizationCode: {
    type: String,
    trim: true
  },
  organizationType: {
    type: String
  },
  parentId: {
    type: String,
    default: '0'
  },
  sortNumber: {
    type: Number,
    default: 0
  },
  comments: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Organization', organizationSchema);
