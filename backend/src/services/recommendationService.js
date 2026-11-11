/**
 * recommendationService — CampusOne's "AI Recommendation Module", v1.
 *
 * This is a transparent, rule-based content recommender (no black box, easy to
 * explain in a viva). It scores approved resources for a given user using
 * signals we already collect, and returns the top matches with a human-readable
 * `reason` for each ("Because you study DBMS").
 *
 * DESIGN SEAM: everything funnels through `getRecommendationsForUser`. To plug
 * in a real ML/LLM service later, implement the same signature (return
 * [{ resource, score, reason }]) and swap it in — no caller changes needed.
 *
 * Signals & weights (see WEIGHTS): subject match, semester match, department
 * match, preferred resource type (learned from the user's bookmarks/history),
 * and a small popularity term. Resources the user already bookmarked are
 * excluded so recommendations stay fresh.
 */
import { Resource, Bookmark } from '../models/index.js';
import { RESOURCE_STATUS } from '../utils/constants.js';

const WEIGHTS = {
  subject: 5,
  semester: 3,
  department: 2,
  preferredType: 2,
  popularity: 1, // max contribution after normalization
};

const norm = (s) => String(s || '').trim().toLowerCase();

/**
 * @param {object} user  Mongoose user (may be lean)
 * @param {object} opts  { limit }
 * @returns {Promise<Array<{ resource, score, reason }>>}
 */
export async function getRecommendationsForUser(user, { limit = 8 } = {}) {
  if (!user) return [];

  const userSubjects = new Set((user.subjects || []).map(norm));
  const userSemester = user.semester;
  const userDept = user.department ? String(user.department) : null;

  // Learn preferred resource types from the user's bookmarks.
  const bookmarks = await Bookmark.find({ user: user._id })
    .populate('resource', 'type subject')
    .lean();
  const bookmarkedIds = new Set(
    bookmarks.filter((b) => b.resource).map((b) => String(b.resource._id))
  );
  const typeCount = {};
  bookmarks.forEach((b) => {
    if (b.resource?.type) typeCount[b.resource.type] = (typeCount[b.resource.type] || 0) + 1;
    // Bookmarked subjects are also strong interest signals.
    if (b.resource?.subject) userSubjects.add(norm(b.resource.subject));
  });
  const preferredType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Candidate pool: approved resources, excluding those already bookmarked.
  const candidates = await Resource.find({
    status: RESOURCE_STATUS.APPROVED,
    _id: { $nin: [...bookmarkedIds] },
  })
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('department', 'name code')
    .lean();

  if (candidates.length === 0) return [];

  const maxDownloads = Math.max(1, ...candidates.map((c) => c.downloads || 0));

  const scored = candidates.map((resource) => {
    let score = 0;
    const reasons = [];

    if (userSubjects.size && userSubjects.has(norm(resource.subject))) {
      score += WEIGHTS.subject;
      reasons.push(`you study ${resource.subject}`);
    }
    if (userSemester && resource.semester === userSemester) {
      score += WEIGHTS.semester;
      reasons.push(`semester ${userSemester}`);
    }
    if (userDept && resource.department && String(resource.department._id) === userDept) {
      score += WEIGHTS.department;
      reasons.push('your department');
    }
    if (preferredType && resource.type === preferredType) {
      score += WEIGHTS.preferredType;
      reasons.push(`you often save ${resource.type.replace('_', ' ')}s`);
    }
    // Popularity: normalized downloads.
    score += (WEIGHTS.popularity * (resource.downloads || 0)) / maxDownloads;

    const reason = reasons.length ? `Because ${reasons.join(' · ')}` : 'Popular on CampusOne';
    return { resource, score, reason };
  });

  return scored
    .filter((s) => s.score > 0.001)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export default { getRecommendationsForUser };
