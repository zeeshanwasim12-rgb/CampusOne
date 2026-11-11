/**
 * Helpers for consistent JSON responses and list pagination.
 *
 * Every successful response looks like:  { success: true, data, message? }
 * Every paginated list looks like:       { success: true, data: [...], pagination: {...} }
 * The central error middleware produces:  { success: false, message, details? }
 */

export const sendOk = (res, data, message, status = 200) =>
  res.status(status).json({ success: true, message, data });

export const sendCreated = (res, data, message = 'Created') =>
  res.status(201).json({ success: true, message, data });

/**
 * Parse ?page= & ?limit= query params into safe numbers.
 * Defaults: page 1, limit 12, hard cap 100.
 */
export const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 12));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const sendPaginated = (res, items, total, { page, limit }) =>
  res.status(200).json({
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: page * limit < total,
    },
  });

export default { sendOk, sendCreated, sendPaginated, parsePagination };
