export const dynamic = 'force-dynamic';
import { totpDisableHandler } from '@/controllers/authController';

export async function POST(request) {
  return totpDisableHandler(request);
}
