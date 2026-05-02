/**
 * Standard API response helpers.
 * All API routes use these to ensure a consistent response shape.
 */

/**
 * @param {object} data - Response payload
 * @param {string} [message] - Optional success message
 * @param {number} [status=200] - HTTP status code
 * @returns {Response}
 */
export function successResponse(data, message = 'Success', status = 200) {
  return Response.json(
    { success: true, message, data },
    { status }
  );
}

/**
 * @param {string} message - Error message
 * @param {number} [status=500] - HTTP status code
 * @param {object|null} [errors=null] - Optional validation errors
 * @returns {Response}
 */
export function errorResponse(message, status = 500, errors = null) {
  return Response.json(
    { success: false, message, ...(errors && { errors }) },
    { status }
  );
}
