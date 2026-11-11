/**
 * userController — the logged-in user's own profile & academic preferences.
 * (Admin user management lives in adminController.)
 */
import { User } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/apiResponse.js';

// GET /api/users/me
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('department', 'name code');
  return sendOk(res, { user });
});

// PATCH /api/users/me  — update editable profile fields
export const updateMe = asyncHandler(async (req, res) => {
  const allowed = [
    'name',
    'bio',
    'phone',
    'avatarUrl',
    'program',
    'semester',
    'rollNumber',
    'subjects',
    'department',
  ];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).populate('department', 'name code');

  return sendOk(res, { user }, 'Profile updated');
});

// PATCH /api/users/me/password  — change password (local auth)
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash');

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }
  user.password = newPassword;
  await user.save();
  return sendOk(res, null, 'Password changed');
});

export default { getMe, updateMe, changePassword };
