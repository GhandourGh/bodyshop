export const dynamic = 'force-dynamic';
import { authenticate } from '@/middlewares/authMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import prisma from '@/lib/db';

export async function PATCH(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { mechanicId } = await request.json();
    if (!mechanicId) return errorResponse('mechanicId is required', 400);

    const job = await prisma.jobs.update({
      where: { id },
      data: { assigned_mechanic_id: mechanicId },
    });

    return successResponse(job, 'Mechanic assigned successfully');
  } catch (err) {
    return errorResponse(err.message, 400);
  }
}
