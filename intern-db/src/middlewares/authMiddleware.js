import jwt from 'jsonwebtoken';
import { config } from '@/lib/config';
import { errorResponse } from '@/lib/apiResponse';

/**
 * Extracts and verifies the Bearer JWT from the Authorization header.
 * Returns the decoded user payload { id, email, role } on success.
 * Returns an error Response on failure (call .error on the returned object to check).
 *
 * Usage in a route:
 *   const auth = await authenticate(request);
 *   if (auth.error) return auth.error;
 *   const { user } = auth;
 *
 * @param {Request} request
 * @returns {{ user: { id, email, role } } | { error: Response }}
 */
export const authenticate = (request) => {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: errorResponse('Missing or malformed Authorization header', 401) };
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    return { user: { id: decoded.id, email: decoded.email, role: decoded.role } };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { error: errorResponse('Token has expired', 401) };
    }
    return { error: errorResponse('Invalid token', 401) };
  }
};
