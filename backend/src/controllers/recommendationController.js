/**
 * recommendationController — thin HTTP wrapper around recommendationService.
 * Keeping the HTTP layer this thin is deliberate: the recommendation logic is
 * fully isolated and independently testable/replaceable (see the service).
 */
import { getRecommendationsForUser } from '../services/recommendationService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/apiResponse.js';

// GET /api/recommendations?limit=
export const getRecommendations = asyncHandler(async (req, res) => {
  const limit = Math.min(20, parseInt(req.query.limit, 10) || 8);
  const recs = await getRecommendationsForUser(req.user, { limit });
  return sendOk(res, recs);
});

export default { getRecommendations };
