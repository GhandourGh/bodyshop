export const dynamic = 'force-dynamic';

import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '@/middlewares/authMiddleware';
import { requireRole } from '@/middlewares/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import prisma from '@/lib/db';

/**
 * GET /api/booking-inquiries — all portal saved quote / booking leads (staff only)
 */
export async function GET(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  const roleCheck = requireRole(auth.user, ['admin', 'mechanic']);
  if (roleCheck.error) return roleCheck.error;

  try {
    const rows = await prisma.booking_inquiries.findMany({
      orderBy: { created_at: 'desc' },
      take: 200,
    });

    const data = rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      createdAt: r.created_at,
      payload: r.payload,
    }));

    return successResponse(data, 'Booking inquiries loaded');
  } catch (err) {
    return errorResponse(err.message || 'Failed to load inquiries', 500);
  }
}

/**
 * POST /api/booking-inquiries — customer submits a repair request after getting an estimate
 * Body: { name, phone?, estimatePayload: { inputs, estimate } }
 * Requires: authenticated customer
 */
export async function POST(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  const roleCheck = requireRole(auth.user, ['customer', 'admin', 'mechanic']);
  if (roleCheck.error) return roleCheck.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { name, phone, estimatePayload } = body;

  if (!name?.trim()) {
    return errorResponse('Name is required', 400);
  }

  try {
    const row = await prisma.booking_inquiries.create({
      data: {
        id: uuidv4(),
        user_id: auth.user.id,
        name: name.trim(),
        email: auth.user.email || null,
        phone: phone?.trim() || null,
        payload: {
          ...(estimatePayload ?? {}),
          submittedAt: new Date().toISOString(),
          source: 'portal_send_request',
        },
      },
    });

    return successResponse(
      { id: row.id },
      'Request submitted — the shop will be in touch.'
    );
  } catch (err) {
    return errorResponse(err.message || 'Failed to submit request', 500);
  }
}
