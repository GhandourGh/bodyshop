export const dynamic = 'force-dynamic';
import { getMe } from '@/controllers/userController';

export async function GET(request) {
  return getMe(request);
}
