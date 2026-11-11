/**
 * communityController — student community feed: posts, likes, comments, reports.
 * Reports feed the admin moderation queue; hidden posts disappear for everyone
 * except their author and admins.
 */
import { CommunityPost, Comment } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendOk, sendCreated, sendPaginated, parsePagination } from '../utils/apiResponse.js';
import { notifyUser } from '../services/notificationService.js';
import { ROLES, NOTIFICATION_TYPES } from '../utils/constants.js';

const isAdmin = (user) => user?.role === ROLES.ADMIN;

function decorate(post, user) {
  const obj = post.toJSON ? post.toJSON() : post;
  obj.likedByMe = user ? (post.likes || []).some((l) => String(l) === String(user._id)) : false;
  obj.isMine = user ? String(post.author?._id || post.author) === String(user._id) : false;
  return obj;
}

// GET /api/community/posts?category=&tag=&search=&sort=
export const listPosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { category, tag, search, sort } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (tag) filter.tags = tag.toLowerCase();
  if (search) filter.$text = { $search: search };

  // Non-admins never see hidden posts (except their own).
  if (!isAdmin(req.user)) {
    filter.$or = [{ isHidden: false }];
    if (req.user) filter.$or.push({ author: req.user._id });
  }

  const sortSpec = sort === 'top' ? { 'likes.0': -1, createdAt: -1 } : { createdAt: -1 };

  const [items, total] = await Promise.all([
    CommunityPost.find(filter)
      .populate('author', 'name role avatarUrl')
      .sort(sortSpec)
      .skip(skip)
      .limit(limit),
    CommunityPost.countDocuments(filter),
  ]);

  return sendPaginated(res, items.map((p) => decorate(p, req.user)), total, { page, limit });
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id).populate('author', 'name role avatarUrl');
  if (!post || (post.isHidden && !isAdmin(req.user) && String(post.author._id) !== String(req.user?._id))) {
    throw ApiError.notFound('Post not found');
  }
  return sendOk(res, decorate(post, req.user));
});

export const createPost = asyncHandler(async (req, res) => {
  const { title, body, category, tags } = req.body;
  const post = await CommunityPost.create({
    author: req.user._id,
    title,
    body,
    category,
    tags: Array.isArray(tags)
      ? tags.map((t) => String(t).toLowerCase())
      : String(tags || '')
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
  });
  await post.populate('author', 'name role avatarUrl');
  return sendCreated(res, decorate(post, req.user), 'Post created');
});

export const deletePost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');
  if (!isAdmin(req.user) && String(post.author) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only delete your own posts');
  }
  await Comment.deleteMany({ post: post._id });
  await post.deleteOne();
  return sendOk(res, null, 'Post deleted');
});

// POST /api/community/posts/:id/like  — idempotent toggle
export const toggleLike = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');

  const id = String(req.user._id);
  const idx = post.likes.findIndex((l) => String(l) === id);
  let liked;
  if (idx >= 0) {
    post.likes.splice(idx, 1);
    liked = false;
  } else {
    post.likes.push(req.user._id);
    liked = true;
  }
  await post.save();
  return sendOk(res, { liked, likeCount: post.likes.length });
});

// POST /api/community/posts/:id/report
export const reportPost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');

  const already = post.reports.some((r) => String(r.by) === String(req.user._id));
  if (!already) {
    post.reports.push({ by: req.user._id, reason: req.body.reason || '' });
    await post.save();
  }
  return sendOk(res, null, 'Post reported. Our moderators will review it.');
});

// ---- Comments ----
export const listComments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination({ ...req.query, limit: req.query.limit || 50 });
  const filter = { post: req.params.id };
  const [items, total] = await Promise.all([
    Comment.find(filter).populate('author', 'name role avatarUrl').sort({ createdAt: 1 }).skip(skip).limit(limit),
    Comment.countDocuments(filter),
  ]);
  return sendPaginated(res, items, total, { page, limit });
});

export const createComment = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');

  const comment = await Comment.create({
    post: post._id,
    author: req.user._id,
    body: req.body.body,
  });
  await CommunityPost.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } });
  await comment.populate('author', 'name role avatarUrl');

  // Notify the post author (unless commenting on their own post).
  if (String(post.author) !== String(req.user._id)) {
    notifyUser(post.author, {
      type: NOTIFICATION_TYPES.COMMUNITY,
      title: 'New comment on your post',
      message: `${req.user.name} commented on "${post.title}"`,
      link: `/community/${post._id}`,
    }).catch(() => {});
  }

  return sendCreated(res, comment, 'Comment added');
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw ApiError.notFound('Comment not found');
  if (!isAdmin(req.user) && String(comment.author) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only delete your own comments');
  }
  await comment.deleteOne();
  await CommunityPost.updateOne({ _id: comment.post }, { $inc: { commentCount: -1 } });
  return sendOk(res, null, 'Comment deleted');
});

export default {
  listPosts,
  getPost,
  createPost,
  deletePost,
  toggleLike,
  reportPost,
  listComments,
  createComment,
  deleteComment,
};
