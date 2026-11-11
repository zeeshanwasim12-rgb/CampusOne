import mongoose from 'mongoose';
import { NOTICE_CATEGORIES, PRIORITIES } from '../utils/constants.js';

/**
 * Notice — announcements shown on the Notices page and pushed as notifications.
 * Created by faculty/admin.
 */
const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: 'text' },
    description: { type: String, required: true },
    category: { type: String, enum: NOTICE_CATEGORIES, default: 'general', index: true },
    priority: { type: String, enum: PRIORITIES, default: 'medium', index: true },

    // Optional attachment (stored like a resource file).
    attachment: {
      key: { type: String, default: '' },
      originalName: { type: String, default: '' },
      url: { type: String, default: '' },
      driver: { type: String, enum: ['s3', 'local', ''], default: '' },
    },

    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }, // null = all
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Optional deadline (for assignment/exam notices) used on the dashboard.
    dueDate: { type: Date },
    isPinned: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

noticeSchema.index({ title: 'text', description: 'text' });

export const Notice = mongoose.model('Notice', noticeSchema);
export default Notice;
