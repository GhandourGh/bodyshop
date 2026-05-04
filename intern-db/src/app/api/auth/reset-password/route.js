export const dynamic = 'force-dynamic';
import { resetPassword } from '@/controllers/authController';

export async function POST(request) {
  return resetPassword(request);
}
