/**
 * Pagination helper.
 * Extracts page/limit from query params and returns offset/limit for Sequelize.
 *
 * Usage in controller:
 *   const { offset, limit, page } = paginate(req.query);
 *   const { count, rows } = await Model.findAndCountAll({ offset, limit });
 *   return paginatedResponse(res, rows, count, page, limit);
 */

export function paginate(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function paginatedResponse(res, data, totalItems, page, limit, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  });
}
