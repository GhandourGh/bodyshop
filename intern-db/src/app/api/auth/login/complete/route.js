export const dynamic = 'force-dynamic';
import { loginComplete } from '@/controllers/authController';

export async function POST(request) {
  return loginComplete(request);
}
