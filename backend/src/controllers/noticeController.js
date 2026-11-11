/**
 * noticeController — announcements. Faculty/admin create; everyone reads.
 * Creating a notice notifies all students (in-app + live socket).
 */
import { Notice } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendOk, sendCreated, sendPaginated, parsePagination } from '../utils/apiResponse.js';
import * as storage from '../services/storageService.js';
import { notifyAllStudents } from '../services/notificationService.js';
import { ROLES, NOTIFICATION_TYPES } from '../utils/constants.js';

// GET /api/notices?category=&priority=&search=
export const listNotices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { category, priority, search } = req.query;

  const filter = { isActive: true };
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (search) filter.$text = { $search: search };

  const [items, total] = await Promise.all([
    Notice.find(filter)
      .populate('postedBy', 'name role')
      .populate('department', 'name code')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notice.countDocuments(filter),
  ]);

  return sendPaginated(res, items, total, { page, limit });
});

export const getNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id)
    .populate('postedBy', 'name role')
    .populate('department', 'name code');
  if (!notice) throw ApiError.notFound('Notice not found');
  return sendOk(res, notice);
});

// POST /api/notices  (faculty/admin) — optional `attachment` file
export const createNotice = asyncHandler(async (req, res) => {
  const data = {
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    priority: req.body.priority,
    department: req.body.department || undefined,
    dueDate: req.body.dueDate || undefined,
    isPinned: req.body.isPinned === 'true' || req.body.isPinned === true,
    postedBy: req.user._id,
  };

  if (req.file) {
    const key = storage.buildKey('notices', req.file.originalname);
    const stored = await storage.putObject({
      buffer: req.file.buffer,
      key,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
    data.attachment = { ...stored, originalName: req.file.originalname };
  }

  const notice = await Notice.create(data);

  notifyAllStudents(
    {
      type: NOTIFICATION_TYPES.NOTICE,
      title: `Notice: ${notice.title}`,
      message: notice.description.slice(0, 140),
      link: '/notices',
    },
    { exclude: req.user._id }
  ).catch(() => {});

  return sendCreated(res, notice, 'Notice published');
});

export const updateNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) throw ApiError.notFound('Notice not found');
  if (req.user.role !== ROLES.ADMIN && String(notice.postedBy) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only edit your own notices');
  }
  Object.assign(notice, req.body);
  await notice.save();
  return sendOk(res, notice, 'Notice updated');
});

export const deleteNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) throw ApiError.notFound('Notice not found');
  if (req.user.role !== ROLES.ADMIN && String(notice.postedBy) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only delete your own notices');
  }
  if (notice.attachment?.key) await storage.deleteObject(notice.attachment);
  await notice.deleteOne();
  return sendOk(res, null, 'Notice deleted');
});

export default { listNotices, getNotice, createNotice, updateNotice, deleteNotice };
