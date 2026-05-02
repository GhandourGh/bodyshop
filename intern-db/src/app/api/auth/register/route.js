export const dynamic = 'force-dynamic';
import { register } from '@/controllers/authController';

export async function POST(request) {
  return register(request);
}
