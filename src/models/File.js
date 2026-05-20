const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 255 },
  path: { type: String, required: true, trim: true },
  length: { type: Number, required: true },
  contentType: { type: String, required: true, trim: true },
  createUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);
