import mongoose from 'mongoose';

/**
 * Comment — a reply on a community post. Kept in its own collection (rather
 * than embedded) so comment lists paginate independently of the post.
 */
const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, maxlength: 2000 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
