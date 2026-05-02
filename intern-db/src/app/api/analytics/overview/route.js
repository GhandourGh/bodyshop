export const dynamic = 'force-dynamic';
import { getOverview } from '@/controllers/analyticsController';
import { authenticate } from '@/middlewares/authMiddleware';

export async function GET(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  
  return getOverview(request);
}
