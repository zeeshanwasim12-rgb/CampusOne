/**
 * Role-based authorization. Use after `authenticate`:
 *
 *   router.post('/', authenticate, authorize(ROLES.FACULTY, ROLES.ADMIN), handler)
 *
 * Admins are allowed through every `authorize` gate by design (superuser).
 */
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../utils/constants.js';

export const authorize =
  (...allowedRoles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.role === ROLES.ADMIN) return next(); // admin can do anything
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };

export const adminOnly = authorize(ROLES.ADMIN);
export const facultyOrAdmin = authorize(ROLES.FACULTY, ROLES.ADMIN);

export default { authorize, adminOnly, facultyOrAdmin };
