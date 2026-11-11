import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLE_VALUES, ROLES } from '../utils/constants.js';

/**
 * User — a single account for students, faculty and admins.
 * `role` drives authorization everywhere in the app.
 *
 * Auth is provider-agnostic:
 *   - local mode  -> `passwordHash` is set, we verify with bcrypt
 *   - cognito mode -> `cognitoSub` links to the Cognito user; no password stored
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    passwordHash: { type: String, select: false },
    cognitoSub: { type: String, index: true, sparse: true },

    role: { type: String, enum: ROLE_VALUES, default: ROLES.STUDENT, index: true },

    // Profile
    avatarUrl: { type: String, default: '' },
    bio: { type: String, maxlength: 300, default: '' },
    phone: { type: String, default: '' },

    // Academic context (used by the recommendation engine)
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    program: { type: String, default: '' }, // e.g. "B.Tech CSE"
    semester: { type: Number, min: 1, max: 10 },
    rollNumber: { type: String, default: '' },
    subjects: [{ type: String, trim: true }], // e.g. ["DBMS", "OS"]

    // Presence (best-effort, updated by the chat socket layer)
    isOnline: { type: Boolean, default: false },
    lastSeenAt: { type: Date },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash the password whenever it is set/changed via the virtual `password`.
userSchema.virtual('password').set(function setPassword(plain) {
  this._plainPassword = plain;
});

userSchema.pre('save', async function hashPassword(next) {
  if (this._plainPassword) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this._plainPassword, salt);
    this._plainPassword = undefined;
  }
  next();
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(plain, this.passwordHash);
};

// Never leak the hash to clients.
userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
export default User;
