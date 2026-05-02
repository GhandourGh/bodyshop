export const dynamic = 'force-dynamic';
import { listPredictions } from '@/controllers/aiController';
import { authenticate } from '@/middlewares/authMiddleware';
import { errorResponse } from '@/lib/apiResponse';

const requireAdmin = (request) => {
  const auth = authenticate(request);
  if (auth.error) return auth;
  if (auth.user.role.toLowerCase() !== 'admin') {
    return { error: errorResponse('Forbidden: Admin access required', 403) };
  }
  return auth;
};

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;
  
  return listPredictions(request);
}
