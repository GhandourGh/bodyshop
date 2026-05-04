export const dynamic = 'force-dynamic';
import { listCustomers, addCustomer } from '@/controllers/customerController';
import { authenticate } from '@/middlewares/authMiddleware';
import { errorResponse } from '@/lib/apiResponse';

const requireAdmin = (request) => {
  const auth = authenticate(request);
  if (auth.error) return auth;
  if ((auth.user.role || '').toLowerCase() !== 'admin') {
    return { error: errorResponse('Forbidden: Admin access required', 403) };
  }
  return auth;
};

export async function GET(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  return listCustomers();
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  return addCustomer(request);
}
