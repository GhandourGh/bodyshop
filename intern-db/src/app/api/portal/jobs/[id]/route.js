export const dynamic = 'force-dynamic';

import { authenticate } from '@/middlewares/authMiddleware';
import { requireRole } from '@/middlewares/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { getPortalJobForUser } from '@/services/jobService';

/**
 * GET /api/portal/jobs/[id] — one job if it belongs to this customer
 */
export async function GET(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  const roleCheck = requireRole(auth.user, ['customer']);
  if (roleCheck.error) return roleCheck.error;

  try {
    const { id } = await params;
    const data = await getPortalJobForUser(id, auth.user.id);
    if (!data) return errorResponse('Job not found', 404);
    return successResponse(data, 'Job loaded');
  } catch (err) {
    return errorResponse(err.message || 'Failed to load job', 500);
  }
}
