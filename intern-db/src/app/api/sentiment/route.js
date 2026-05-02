export const dynamic = 'force-dynamic';
import { authenticate } from '@/middlewares/authMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function POST(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  try {
    const { text } = await request.json();
    if (!text || !text.trim()) return errorResponse('text is required', 400);

    const aiRes = await fetch(`${AI_URL}/analyze-sentiment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!aiRes.ok) throw new Error('AI sentiment service unavailable');

    const data = await aiRes.json();
    return successResponse(data, 'Sentiment analyzed');
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
