export const dynamic = 'force-dynamic';
import { removeJob, editJob, getJob } from '@/controllers/jobController';
import { authenticate } from '@/middlewares/authMiddleware';
import { requireRole } from '@/middlewares/roleMiddleware';

export async function GET(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  const roleCheck = requireRole(auth.user, ['admin', 'mechanic']);
  if (roleCheck.error) return roleCheck.error;
  const { id } = await params;
  return getJob(id);
}

export async function DELETE(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  const roleCheck = requireRole(auth.user, ['admin', 'mechanic']);
  if (roleCheck.error) return roleCheck.error;
  const { id } = await params;
  return removeJob(id);
}

export async function PUT(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  const roleCheck = requireRole(auth.user, ['admin', 'mechanic']);
  if (roleCheck.error) return roleCheck.error;
  const { id } = await params;
  return editJob(id, request);
}
