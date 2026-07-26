const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    googleId: {
      type:     String,
      unique:   true,
      sparse:   true,
    },
    name: {
      type:     String,
      required: true,
      trim:     true,
    },
    email: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    password: {
      type:     String,
      select:   false, // exclude password from query results by default
    },
    avatar: {
      type:    String,
      default: null,
    },
    role: {
      type:    String,
      enum:    ['user', 'admin'],
      default: 'user',
    },
    lastLogin: {
      type:    Date,
      default: Date.now,
    },
    scanHistory: [
      {
        crop:       String,
        disease:    String,
        confidence: Number,
        imageUrl:   String,
        createdAt:  { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Pre-save hook: Hash password if modified
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method: Compare candidate password with stored hash
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual: first name only
UserSchema.virtual('firstName').get(function () {
  return this.name?.split(' ')[0] || 'User';
});

// Strip sensitive fields from JSON output
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    delete ret.googleId;
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model('User', UserSchema);
