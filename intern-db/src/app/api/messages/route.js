export const dynamic = 'force-dynamic';
import { authenticate } from '@/middlewares/authMiddleware';
import { createMessage } from '@/services/messageService';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export async function POST(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { jobId, messageType, customerName, jobDetails, language, channel } = body;

    if (!jobId || !customerName || !jobDetails) {
      return errorResponse('jobId, customerName, and jobDetails are required', 400);
    }

    const message = await createMessage({
      jobId,
      userId: auth.user.id,
      messageType,
      customerName,
      jobDetails,
      language,
      channel,
    });

    return successResponse(message, 'Message generated and saved', 201);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
