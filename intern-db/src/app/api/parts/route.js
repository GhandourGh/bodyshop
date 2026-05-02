export const dynamic = 'force-dynamic';
import { listParts, addPart } from '@/controllers/partController';
import { authenticate } from '@/middlewares/authMiddleware';

export async function GET(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  
  return listParts(request);
}

export async function POST(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  
  return addPart(request);
}
