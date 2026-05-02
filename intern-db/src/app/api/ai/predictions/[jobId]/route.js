export const dynamic = 'force-dynamic';
import { authenticate } from '@/middlewares/authMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import prisma from '@/lib/db';

export async function GET(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  try {
    const { jobId } = await params;
    const predictions = await prisma.ai_predictions.findMany({
      where: { job_id: jobId },
      orderBy: { created_at: 'desc' },
    });

    return successResponse(
      predictions.map(p => ({
        id: p.id,
        type: p.type,
        confidence: p.confidence ? (p.confidence * 100).toFixed(1) + '%' : 'N/A',
        result: p.result,
        created: p.created_at,
      })),
      'Predictions retrieved'
    );
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
