/**
 * notificationController — the in-app notification center.
 */
import { Notification } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendOk, sendPaginated, parsePagination } from '../utils/apiResponse.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination({ ...req.query, limit: req.query.limit || 20 });
  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;

  const [items, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);
  return sendPaginated(res, items, total, { page, limit });
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
  return sendOk(res, { count });
});

export const markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!n) throw ApiError.notFound('Notification not found');
  return sendOk(res, n);
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  return sendOk(res, null, 'All notifications marked read');
});

export const remove = asyncHandler(async (req, res) => {
  await Notification.deleteOne({ _id: req.params.id, user: req.user._id });
  return sendOk(res, null, 'Notification removed');
});

export default { listNotifications, unreadCount, markRead, markAllRead, remove };
