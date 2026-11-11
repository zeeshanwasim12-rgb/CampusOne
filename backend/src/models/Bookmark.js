import mongoose from 'mongoose';

/**
 * Bookmark — a user saving a resource for later. The compound unique index
 * guarantees a user can bookmark a given resource only once (idempotent toggle).
 */
const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  },
  { timestamps: true }
);

bookmarkSchema.index({ user: 1, resource: 1 }, { unique: true });

export const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
export default Bookmark;
