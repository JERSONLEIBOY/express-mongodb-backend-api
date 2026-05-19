const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  nickname: {
    type: String,
    trim: true,
    maxlength: 50
  },
  avatar: { type: String },
  sex: { type: String },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  birthday: { type: Date },
  introduction: { type: String },
  address: { type: String },
  tellPre: { type: String },
  tell: { type: String },
  password: { type: String, required: true, minlength: 6 },
  // 0正常, 1冻结
  status: { type: Number, enum: [0, 1], default: 0 },
  comments: { type: String, maxlength: 500 },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }]
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
