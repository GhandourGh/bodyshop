export const dynamic = 'force-dynamic';

import { authenticate } from '@/middlewares/authMiddleware';
import { requireRole } from '@/middlewares/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import prisma from '@/lib/db';

/**
 * GET /api/portal/inquiries — customer’s saved booking / quote requests
 */
export async function GET(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  const roleCheck = requireRole(auth.user, ['customer']);
  if (roleCheck.error) return roleCheck.error;

  try {
    const emailNorm = (auth.user.email || '').trim().toLowerCase();
    const orFilter = [{ user_id: auth.user.id }];
    if (emailNorm) orFilter.push({ email: emailNorm });
    const rows = await prisma.booking_inquiries.findMany({
      where: { OR: orFilter },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    const data = rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      createdAt: r.created_at,
      payload: r.payload,
    }));

    return successResponse(data, 'Inquiries loaded');
  } catch (err) {
    return errorResponse(err.message || 'Failed to load inquiries', 500);
  }
}
