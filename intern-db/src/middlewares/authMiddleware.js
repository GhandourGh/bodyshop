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
    if (decoded.purpose === 'totp_pending') {
      return { error: errorResponse('Use login complete with this token, not API access', 401) };
    }
    return { user: { id: decoded.id, email: decoded.email, role: decoded.role } };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { error: errorResponse('Token has expired', 401) };
    }
    return { error: errorResponse('Invalid token', 401) };
  }
};

/**
 * Optional Bearer JWT — returns { user } or { user: null } (never throws).
 * @param {Request} request
 * @returns {{ user: { id: string, email: string, role: string } | null }}
 */
export const tryAuthenticate = (request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null };
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (decoded.purpose === 'totp_pending') return { user: null };
    return { user: { id: decoded.id, email: decoded.email, role: decoded.role } };
  } catch {
    return { user: null };
  }
};
