import mongoose from 'mongoose';
import { COMMUNITY_CATEGORIES } from '../utils/constants.js';

/**
 * CommunityPost — a discussion post in the student community feed.
 * Likes are stored as an array of user ids so we can toggle idempotently and
 * show "liked by me" without a second query. Reports drive admin moderation.
 */
const reportSubSchema = new mongoose.Schema(
  {
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const communityPostSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200, index: 'text' },
    body: { type: String, required: true, maxlength: 5000 },
    category: { type: String, enum: COMMUNITY_CATEGORIES, default: 'General', index: true },
    tags: [{ type: String, trim: true, lowercase: true }],

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentCount: { type: Number, default: 0 },

    reports: [reportSubSchema],
    isHidden: { type: Boolean, default: false }, // hidden by moderation
  },
  { timestamps: true }
);

communityPostSchema.index({ title: 'text', body: 'text', tags: 'text' });

communityPostSchema.virtual('likeCount').get(function likeCount() {
  return this.likes ? this.likes.length : 0;
});
communityPostSchema.virtual('reportCount').get(function reportCount() {
  return this.reports ? this.reports.length : 0;
});
communityPostSchema.set('toJSON', { virtuals: true });

export const CommunityPost = mongoose.model('CommunityPost', communityPostSchema);
export default CommunityPost;
