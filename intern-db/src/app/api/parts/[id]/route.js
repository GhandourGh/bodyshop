export const dynamic = 'force-dynamic';
import { removePart, editPart } from '@/controllers/partController';
import { authenticate } from '@/middlewares/authMiddleware';

export async function DELETE(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  
  const { id } = await params;
  return removePart(id);
}

export async function PUT(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  
  const { id } = await params;
  return editPart(id, request);
}
