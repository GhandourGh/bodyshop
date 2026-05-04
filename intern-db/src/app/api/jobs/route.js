export const dynamic = 'force-dynamic';
import { listJobs, addJob } from '@/controllers/jobController';
import { authenticate } from '@/middlewares/authMiddleware';
import { requireRole } from '@/middlewares/roleMiddleware';

export async function GET(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  const roleCheck = requireRole(auth.user, ['admin', 'mechanic']);
  if (roleCheck.error) return roleCheck.error;
  return listJobs(request);
}

export async function POST(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  const roleCheck = requireRole(auth.user, ['admin', 'mechanic']);
  if (roleCheck.error) return roleCheck.error;
  return addJob(request);
}
