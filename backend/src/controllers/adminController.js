/**
 * adminController — platform statistics, user management and community
 * moderation. All routes here are admin-only (enforced in the router).
 */
import {
  User,
  Faculty,
  Resource,
  Notice,
  Event,
  CommunityPost,
  Department,
} from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendOk, sendCreated, sendPaginated, parsePagination } from '../utils/apiResponse.js';
import { ROLES, ROLE_VALUES, RESOURCE_STATUS } from '../utils/constants.js';

// GET /api/admin/stats
export const getStats = asyncHandler(async (_req, res) => {
  const [
    students,
    faculty,
    facultyDirectory,
    resources,
    pendingResources,
    notices,
    events,
    posts,
    reportedPosts,
    departments,
    recentUploads,
  ] = await Promise.all([
    User.countDocuments({ role: ROLES.STUDENT }),
    User.countDocuments({ role: ROLES.FACULTY }),
    Faculty.countDocuments(),
    Resource.countDocuments({ status: RESOURCE_STATUS.APPROVED }),
    Resource.countDocuments({ status: RESOURCE_STATUS.PENDING }),
    Notice.countDocuments(),
    Event.countDocuments(),
    CommunityPost.countDocuments(),
    CommunityPost.countDocuments({ 'reports.0': { $exists: true } }),
    Department.countDocuments(),
    Resource.find().sort({ createdAt: -1 }).limit(5).populate('uploadedBy', 'name').lean(),
  ]);

  return sendOk(res, {
    counts: {
      students,
      faculty,
      facultyDirectory,
      resources,
      pendingResources,
      notices,
      events,
      posts,
      reportedPosts,
      departments,
    },
    recentUploads,
  });
});

// ---- User management ----

// GET /api/admin/users?role=&search=&status=
export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { role, search, status } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (status === 'active') filter.isActive = true;
  if (status === 'disabled') filter.isActive = false;
  if (search) {
    const rx = new RegExp(search.trim(), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { rollNumber: rx }];
  }

  const [items, total] = await Promise.all([
    User.find(filter).populate('department', 'name code').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  return sendPaginated(res, items, total, { page, limit });
});

// POST /api/admin/users  — create faculty/admin/student accounts
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, program, semester, department } = req.body;
  if (!ROLE_VALUES.includes(role)) throw ApiError.badRequest('Invalid role');

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw ApiError.conflict('Email already in use');

  const user = new User({ name, email, password, role, program, semester, department });
  await user.save();
  return sendCreated(res, user, 'User created');
});

// PATCH /api/admin/users/:id  — update role / active status / profile
export const updateUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) throw ApiError.notFound('User not found');

  // Guard against an admin locking themselves out.
  const isSelf = String(target._id) === String(req.user._id);
  if (isSelf && (req.body.role && req.body.role !== ROLES.ADMIN)) {
    throw ApiError.badRequest('You cannot change your own admin role');
  }
  if (isSelf && req.body.isActive === false) {
    throw ApiError.badRequest('You cannot disable your own account');
  }

  const allowed = ['name', 'role', 'isActive', 'department', 'program', 'semester', 'rollNumber'];
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) target[k] = req.body[k];
  });
  await target.save();
  return sendOk(res, target, 'User updated');
});

// DELETE /api/admin/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot delete your own account');
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  return sendOk(res, null, 'User deleted');
});

// ---- Moderation ----

// GET /api/admin/moderation/reported  — posts with at least one report
export const listReportedPosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { 'reports.0': { $exists: true } };

  const [items, total] = await Promise.all([
    CommunityPost.find(filter)
      .populate('author', 'name role')
      .populate('reports.by', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    CommunityPost.countDocuments(filter),
  ]);
  return sendPaginated(res, items, total, { page, limit });
});

// PATCH /api/admin/moderation/posts/:id  { isHidden, clearReports }
export const moderatePost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');

  if (req.body.isHidden !== undefined) post.isHidden = Boolean(req.body.isHidden);
  if (req.body.clearReports) post.reports = [];
  await post.save();
  return sendOk(res, post, 'Post moderated');
});

export default {
  getStats,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listReportedPosts,
  moderatePost,
};
