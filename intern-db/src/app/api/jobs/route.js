export const dynamic = 'force-dynamic';
import { listJobs, addJob } from '@/controllers/jobController';
import { authenticate } from '@/middlewares/authMiddleware';

export async function GET(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  
  return listJobs(request);
}

export async function POST(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  
  return addJob(request);
}
