export const dynamic = 'force-dynamic';
import { removeJob, editJob } from '@/controllers/jobController';
import { authenticate } from '@/middlewares/authMiddleware';

export async function DELETE(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  
  const { id } = await params;
  return removeJob(id);
}

export async function PUT(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  
  const { id } = await params;
  return editJob(id, request);
}
