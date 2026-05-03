export const dynamic = 'force-dynamic';
import { financeSummary } from '@/controllers/financeController';
import { authenticate } from '@/middlewares/authMiddleware';

export async function GET(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  return financeSummary();
}
