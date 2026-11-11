/**
 * bookmarkController — save/unsave resources and list the current user's saved
 * resources (used by the Bookmarks page and the dashboard widget).
 */
import { Bookmark } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk, sendPaginated, parsePagination } from '../utils/apiResponse.js';

// GET /api/bookmarks
export const listBookmarks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { user: req.user._id };

  const [items, total] = await Promise.all([
    Bookmark.find(filter)
      .populate({
        path: 'resource',
        populate: [
          { path: 'uploadedBy', select: 'name role' },
          { path: 'department', select: 'name code' },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Bookmark.countDocuments(filter),
  ]);

  // Map to the resource with an isBookmarked flag (always true here).
  const resources = items
    .filter((b) => b.resource) // guard against deleted resources
    .map((b) => ({ ...b.resource.toJSON(), isBookmarked: true, bookmarkedAt: b.createdAt }));

  return sendPaginated(res, resources, total, { page, limit });
});

// POST /api/bookmarks/:resourceId  — idempotent toggle
export const toggleBookmark = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;
  const existing = await Bookmark.findOne({ user: req.user._id, resource: resourceId });

  if (existing) {
    await existing.deleteOne();
    return sendOk(res, { bookmarked: false }, 'Bookmark removed');
  }
  await Bookmark.create({ user: req.user._id, resource: resourceId });
  return sendOk(res, { bookmarked: true }, 'Bookmarked');
});

export default { listBookmarks, toggleBookmark };
