export const dynamic = 'force-dynamic';
import { authenticate } from '@/middlewares/authMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import prisma from '@/lib/db';

// PATCH /api/parts/:id/stock  — body: { delta: number }
// delta is positive (restock) or negative (consume)
export async function PATCH(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { delta } = await request.json();
    if (delta === undefined || typeof delta !== 'number') {
      return errorResponse('delta (number) is required', 400);
    }

    const part = await prisma.parts.findUnique({ where: { id } });
    if (!part) return errorResponse('Part not found', 404);

    const newStock = (part.stock || 0) + delta;
    if (newStock < 0) return errorResponse('Insufficient stock', 400);

    const updated = await prisma.parts.update({
      where: { id },
      data: { stock: newStock },
    });

    return successResponse({ id: updated.id, name: updated.name, stock: updated.stock }, 'Stock updated');
  } catch (err) {
    return errorResponse(err.message, 400);
  }
}
