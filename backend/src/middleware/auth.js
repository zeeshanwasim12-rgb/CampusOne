/**
 * Authentication middleware.
 *
 * `authenticate` requires a valid bearer token and attaches the resolved user
 * to `req.user`. `optionalAuth` does the same but never blocks the request if
 * the token is missing/invalid (used on public endpoints that personalize
 * results when logged in, e.g. "is this bookmarked by me?").
 */
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { resolveUserFromToken } from '../services/authProvider.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  return null;
}

export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Authentication required');
  req.user = await resolveUserFromToken(token);
  next();
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = await resolveUserFromToken(token);
    } catch {
      req.user = null; // ignore bad token on public routes
    }
  }
  next();
});

export default { authenticate, optionalAuth };
