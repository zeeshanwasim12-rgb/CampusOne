/**
 * searchController — one global search endpoint that fans out across the main
 * collections and returns grouped, capped results. Powers the dashboard quick
 * search and the dedicated search page.
 */
import {
  Resource,
  Faculty,
  CampusLocation,
  Notice,
  Event,
  CommunityPost,
} from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendOk } from '../utils/apiResponse.js';
import { RESOURCE_STATUS } from '../utils/constants.js';

// GET /api/search?q=...&limit=5
export const globalSearch = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) throw ApiError.badRequest('Search query must be at least 2 characters');

  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const perGroup = Math.min(10, parseInt(req.query.limit, 10) || 5);

  const [resources, faculty, locations, notices, events, posts] = await Promise.all([
    Resource.find({ status: RESOURCE_STATUS.APPROVED, $or: [{ title: rx }, { subject: rx }, { tags: rx }] })
      .select('title subject type semester')
      .limit(perGroup)
      .lean(),
    Faculty.find({ $or: [{ name: rx }, { cabinNumber: rx }, { building: rx }] })
      .select('name designation cabinNumber building')
      .limit(perGroup)
      .lean(),
    CampusLocation.find({ isActive: true, $or: [{ name: rx }, { building: rx }, { roomNumber: rx }] })
      .select('name type building roomNumber')
      .limit(perGroup)
      .lean(),
    Notice.find({ isActive: true, $or: [{ title: rx }, { description: rx }] })
      .select('title category priority createdAt')
      .limit(perGroup)
      .lean(),
    Event.find({ isActive: true, $or: [{ name: rx }, { description: rx }] })
      .select('name startAt location')
      .limit(perGroup)
      .lean(),
    CommunityPost.find({ isHidden: false, $or: [{ title: rx }, { body: rx }, { tags: rx }] })
      .select('title category createdAt')
      .limit(perGroup)
      .lean(),
  ]);

  const total =
    resources.length + faculty.length + locations.length + notices.length + events.length + posts.length;

  return sendOk(res, {
    query: q,
    total,
    groups: { resources, faculty, locations, notices, events, posts },
  });
});

export default { globalSearch };
