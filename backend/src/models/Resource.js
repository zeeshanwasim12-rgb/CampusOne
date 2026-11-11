import mongoose from 'mongoose';
import {
  RESOURCE_TYPE_VALUES,
  RESOURCE_STATUS_VALUES,
  RESOURCE_STATUS,
} from '../utils/constants.js';

/**
 * Resource — the unified academic material record.
 *
 * One collection powers PYQs, Assignments, Assignment Guides, Lab Manuals and
 * Study Materials via the `type` field. This avoids five near-identical
 * collections and lets a single search/filter endpoint serve every resource
 * page. The actual file lives in S3 (or local disk in dev); only metadata +
 * a storage key live here — large binaries never go into MongoDB.
 */
const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: 'text' },
    description: { type: String, default: '' },
    type: { type: String, enum: RESOURCE_TYPE_VALUES, required: true, index: true },

    // Academic metadata (all filterable)
    subject: { type: String, required: true, trim: true, index: true },
    course: { type: String, default: '', trim: true }, // e.g. "B.Tech CSE"
    semester: { type: Number, min: 1, max: 10, index: true },
    academicYear: { type: String, default: '' }, // e.g. "2024-25"
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true },
    tags: [{ type: String, trim: true, lowercase: true }],

    // File storage metadata
    file: {
      key: { type: String, default: '' }, // storage object key
      originalName: { type: String, default: '' },
      mimeType: { type: String, default: '' },
      size: { type: Number, default: 0 }, // bytes
      driver: { type: String, enum: ['s3', 'local'], default: 'local' },
      url: { type: String, default: '' }, // direct/public url when available
    },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Moderation: faculty/admin uploads auto-approve; others may be pending.
    status: {
      type: String,
      enum: RESOURCE_STATUS_VALUES,
      default: RESOURCE_STATUS.APPROVED,
      index: true,
    },
    rejectionReason: { type: String, default: '' },

    downloads: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound text index for the global/resource search box.
resourceSchema.index({ title: 'text', description: 'text', subject: 'text', tags: 'text' });
// Common filter combination.
resourceSchema.index({ type: 1, semester: 1, subject: 1, status: 1 });

export const Resource = mongoose.model('Resource', resourceSchema);
export default Resource;
