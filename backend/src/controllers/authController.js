/**
 * authController — local email/password auth (default provider).
 *
 * When AUTH_PROVIDER=cognito, sign-up/sign-in happen on Cognito's side (the
 * frontend talks to Cognito directly and sends us the resulting JWT), so these
 * local endpoints return a clear 400 pointing at that flow.
 */
import { User } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendOk, sendCreated } from '../utils/apiResponse.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../services/tokenService.js';
import { effectiveAuthProvider } from '../config/env.js';
import { ROLES } from '../utils/constants.js';

function ensureLocalProvider() {
  if (effectiveAuthProvider() !== 'local') {
    throw ApiError.badRequest(
      'This deployment uses AWS Cognito. Authenticate via Cognito and call the API with the Cognito token.'
    );
  }
}

const authPayload = (user) => ({
  user: user.toJSON(),
  accessToken: signAccessToken(user),
  refreshToken: signRefreshToken(user),
});

// POST /api/auth/register  (students self-register only)
export const register = asyncHandler(async (req, res) => {
  ensureLocalProvider();
  const { name, email, password, program, semester, rollNumber } = req.body;

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw ApiError.conflict('An account with this email already exists');

  const user = new User({
    name,
    email,
    password, // hashed by the model pre-save hook
    role: ROLES.STUDENT, // public registration is always a student
    program,
    semester,
    rollNumber,
  });
  await user.save();

  return sendCreated(res, authPayload(user), 'Registration successful');
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  ensureLocalProvider();
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) throw ApiError.forbidden('Your account has been disabled');

  return sendOk(res, authPayload(user), 'Login successful');
});

// POST /api/auth/refresh
export const refresh = asyncHandler(async (req, res) => {
  ensureLocalProvider();
  const { refreshToken } = req.body;
  if (!refreshToken) throw ApiError.badRequest('Refresh token required');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized('User not found');

  return sendOk(res, { accessToken: signAccessToken(user) }, 'Token refreshed');
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('department', 'name code');
  return sendOk(res, { user });
});

// POST /api/auth/logout  (stateless — client just drops its tokens)
export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('accessToken');
  return sendOk(res, null, 'Logged out');
});

export default { register, login, refresh, me, logout };
