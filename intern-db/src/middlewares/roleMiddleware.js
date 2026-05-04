import { errorResponse } from '@/lib/apiResponse';

/**
 * Checks if the authenticated user has one of the allowed roles.
 * Call after authenticate() succeeds.
 *
 * Usage in a route:
 *   const roleCheck = requireRole(user, ['ADMIN', 'MECHANIC']);
 *   if (roleCheck.error) return roleCheck.error;
 *
 * @param {{ role: string }} user - decoded JWT payload
 * @param {string[]} allowedRoles - e.g. ['ADMIN', 'MECHANIC']
 * @returns {{ ok: true } | { error: Response }}
 */
export const requireRole = (user, allowedRoles) => {
  const r = (user.role || '').toLowerCase();
  const ok = allowedRoles.some((a) => (a || '').toLowerCase() === r);
  if (!ok) {
    return {
      error: errorResponse(
        `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        403
      ),
    };
  }
  return { ok: true };
};
