export const dynamic = 'force-dynamic';
import { totpSetupHandler } from '@/controllers/authController';

export async function POST(request) {
  return totpSetupHandler(request);
}
