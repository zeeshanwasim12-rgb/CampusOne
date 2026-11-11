/**
 * notificationService — the one place that creates notifications. It persists
 * the notification and (if the user is connected) pushes it live over sockets.
 *
 * Helpers exist for the common "notify many users" cases (e.g. a new notice
 * should reach every student). Fan-out is capped/batched to stay simple.
 */
import { Notification, User } from '../models/index.js';
import { emitToUser } from '../sockets/io.js';
import { ROLES } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

export async function notifyUser(userId, { type, title, message = '', link = '' }) {
  const notification = await Notification.create({ user: userId, type, title, message, link });
  emitToUser(userId, 'notification:new', notification.toJSON());
  return notification;
}

/**
 * Create the same notification for many users. Uses insertMany for efficiency,
 * then emits to each connected user.
 */
export async function notifyUsers(userIds, payload) {
  if (!userIds || userIds.length === 0) return [];
  const docs = userIds.map((user) => ({ user, ...payload }));
  const created = await Notification.insertMany(docs);
  created.forEach((n) => emitToUser(n.user, 'notification:new', n.toJSON()));
  return created;
}

/**
 * Notify all active users with the given role(s). Used for broadcast events
 * like new notices. Excludes the actor so people aren't notified of their own
 * actions.
 */
export async function notifyByRole(roles, payload, { exclude } = {}) {
  const query = { role: { $in: [].concat(roles) }, isActive: true };
  if (exclude) query._id = { $ne: exclude };
  const users = await User.find(query).select('_id').lean();
  logger.debug(`notifyByRole -> ${users.length} recipients`);
  return notifyUsers(users.map((u) => u._id), payload);
}

export const notifyAllStudents = (payload, opts) => notifyByRole(ROLES.STUDENT, payload, opts);

export default { notifyUser, notifyUsers, notifyByRole, notifyAllStudents };
