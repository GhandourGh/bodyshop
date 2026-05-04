export const dynamic = 'force-dynamic';

import { successResponse } from '@/lib/apiResponse';
import { damageRepairGuide, DAMAGE_TYPES } from '@/lib/damageRepairGuide';

/**
 * GET /api/damage-repair-guide — public reference for portal & admin UI (Phase 10).
 */
export async function GET() {
  return successResponse(
    {
      damageTypes: DAMAGE_TYPES,
      guide: damageRepairGuide,
    },
    'Damage repair guide'
  );
}
