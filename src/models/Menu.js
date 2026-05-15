const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  menuType: {
    type: Number,
    enum: [0, 1, 2],
    default: 0
  },
  path: {
    type: String,
    trim: true,
    maxlength: 200,
    default: null
  },
  parentId: {
    type: String,
    default: '0'
  },
  sortNumber: {
    type: Number,
    default: 0
  },
  icon: {
    type: String,
    maxlength: 100,
    default: null
  },
  hide: {
    type: Number,
    enum: [0, 1],
    default: 0
  },
  component: {
    type: String,
    maxlength: 200,
    default: null
  },
  redirect: {
    type: String,
    maxlength: 200,
    default: null
  },
  authority: {
    type: String,
    default: null
  },
  meta: {
    type: String,
    default: null
  },
  openType: {
    type: Number,
    default: null
  },
  checked: {
    type: Number,
    enum: [0, 1],
    default: null
  }
}, {
  timestamps: true
});


module.exports = mongoose.model('Menu', menuSchema);
