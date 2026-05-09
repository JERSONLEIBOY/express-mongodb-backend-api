const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  type: {
    type: String,
    enum: ['directory', 'menu', 'external'],
    required: true
  },
  path: {
    type: String,
    trim: true,
    maxlength: 200
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
    default: null
  },
  sort: {
    type: Number,
    default: 0
  },
  icon: {
    type: String,
    maxlength: 100
  },
  visible: {
    type: Boolean,
    default: true
  },
  component: {
    type: String,
    maxlength: 200
  },
  redirect: {
    type: String,
    maxlength: 200
  }
}, {
  timestamps: true
});

menuSchema.pre('find', function() {
  this.populate('children');
});

menuSchema.virtual('children', {
  ref: 'Menu',
  localField: '_id',
  foreignField: 'parentId'
});

module.exports = mongoose.model('Menu', menuSchema);
