const mongoose = require('mongoose');

const dictionarySchema = new mongoose.Schema({
  dictName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  dictCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  sortNumber: {
    type: Number,
    default: 0
  },
  comments: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Dictionary', dictionarySchema);
