export const dynamic = 'force-dynamic';
import { listCustomers } from '@/controllers/customerController';
import { authenticate } from '@/middlewares/authMiddleware';
import { errorResponse } from '@/lib/apiResponse';

export async function GET(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  
  return listCustomers(request);
}
