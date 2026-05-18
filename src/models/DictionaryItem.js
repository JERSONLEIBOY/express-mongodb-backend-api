const mongoose = require('mongoose');

const dictionaryItemSchema = new mongoose.Schema({
  dictId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dictionary',
    required: true
  },
  dictCode: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  dictDataName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  dictDataCode: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
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

dictionaryItemSchema.index({ dictCode: 1, dictDataCode: 1 }, { unique: true });

module.exports = mongoose.model('DictionaryItem', dictionaryItemSchema);
