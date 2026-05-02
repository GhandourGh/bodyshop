export const dynamic = 'force-dynamic';
import { authenticate } from '@/middlewares/authMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import prisma from '@/lib/db';

const VALID_STATUSES = ['pending', 'in_progress', 'done'];

export async function PATCH(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { status } = await request.json();
    if (!status || !VALID_STATUSES.includes(status)) {
      return errorResponse(`status must be one of: ${VALID_STATUSES.join(', ')}`, 400);
    }

    const job = await prisma.jobs.update({
      where: { id },
      data: { status },
    });

    return successResponse(job, `Job status updated to ${status}`);
  } catch (err) {
    return errorResponse(err.message, 400);
  }
}
