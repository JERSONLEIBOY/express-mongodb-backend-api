const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  roleName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  roleCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  comments: {
    type: String,
    maxlength: 500
  },
  menus: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Role', roleSchema);
