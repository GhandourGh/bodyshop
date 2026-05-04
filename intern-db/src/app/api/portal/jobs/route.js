export const dynamic = 'force-dynamic';

import { authenticate } from '@/middlewares/authMiddleware';
import { requireRole } from '@/middlewares/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { listPortalJobsForUser } from '@/services/jobService';

/**
 * GET /api/portal/jobs — repair jobs for the logged-in customer (via customers.user_id)
 */
export async function GET(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  const roleCheck = requireRole(auth.user, ['customer']);
  if (roleCheck.error) return roleCheck.error;

  try {
    const data = await listPortalJobsForUser(auth.user.id);
    return successResponse(data, 'Jobs loaded');
  } catch (err) {
    return errorResponse(err.message || 'Failed to load jobs', 500);
  }
}
