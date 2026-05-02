export const dynamic = 'force-dynamic';
import { authenticate } from '@/middlewares/authMiddleware';
import { getMessagesByJobId } from '@/services/messageService';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export async function GET(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  try {
    const { jobId } = await params;
    const messages = await getMessagesByJobId(jobId);
    return successResponse(messages, 'Messages retrieved');
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
