export const dynamic = 'force-dynamic';
import { listMechanics } from '@/controllers/mechanicController';
import { authenticate } from '@/middlewares/authMiddleware';

export async function GET(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  
  return listMechanics(request);
}
