const mongoose = require('mongoose');

const dictionaryItemSchema = new mongoose.Schema({
  dictionaryCode: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  label: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  value: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
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

dictionaryItemSchema.index({ dictionaryCode: 1, value: 1 }, { unique: true });

module.exports = mongoose.model('DictionaryItem', dictionaryItemSchema);
