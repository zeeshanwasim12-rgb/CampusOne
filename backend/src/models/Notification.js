import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../utils/constants.js';

/**
 * Notification — an in-app notification for a single user. Delivered live over
 * Socket.IO when the user is connected, and always readable from the
 * notification center in the dashboard.
 */
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      default: NOTIFICATION_TYPES.SYSTEM,
    },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    link: { type: String, default: '' }, // frontend route to open on click
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
