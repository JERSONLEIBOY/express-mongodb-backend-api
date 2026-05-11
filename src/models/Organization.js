const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  type: {
    type: String,
    enum: ['company', 'department', 'team'],
    default: 'team'
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  sort: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

organizationSchema.virtual('children', {
  ref: 'Organization',
  localField: '_id',
  foreignField: 'parentId'
});

module.exports = mongoose.model('Organization', organizationSchema);
