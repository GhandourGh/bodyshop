export const dynamic = 'force-dynamic';
import { authenticate } from '@/middlewares/authMiddleware';
import { requireRole } from '@/middlewares/roleMiddleware';
import { listAuditLogs } from '@/services/auditService';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export async function GET(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  const rc = requireRole(auth.user, ['admin', 'mechanic']);
  if (rc.error) return rc.error;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '150', 10);
    const entity = searchParams.get('entity') || undefined;
    const data = await listAuditLogs({ limit, entity });
    return successResponse(data, 'Audit logs retrieved');
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
