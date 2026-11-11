/**
 * asyncHandler — wraps an async Express handler so any thrown/rejected error
 * is forwarded to `next()` (and thus to the central error middleware).
 * Avoids a try/catch in every controller.
 *
 *   router.get('/', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
