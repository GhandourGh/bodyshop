export const dynamic = 'force-dynamic';
import { removeMechanic } from '@/controllers/mechanicController';
import { authenticate } from '@/middlewares/authMiddleware';
import { errorResponse } from '@/lib/apiResponse';

export async function DELETE(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  
  const { id } = await params;
  if (!id) return errorResponse('Mechanic ID is required', 400);

  return removeMechanic(id);
}
