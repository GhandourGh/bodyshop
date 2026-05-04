export const dynamic = 'force-dynamic';

import { authenticate } from '@/middlewares/authMiddleware';
import { requireRole } from '@/middlewares/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { listIntegrationLogs } from '@/services/integrationLogsReadService';

export async function GET(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  const rc = requireRole(auth.user, ['admin', 'mechanic']);
  if (rc.error) return rc.error;
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const integration_key = searchParams.get('integration_key') || undefined;
    const data = await listIntegrationLogs({
      limit: limit ? parseInt(limit, 10) : 100,
      integration_key,
    });
    return successResponse(data, 'Logs loaded');
  } catch (e) {
    return errorResponse(e.message || 'Failed', 500);
  }
}
