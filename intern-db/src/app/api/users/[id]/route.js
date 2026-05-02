export const dynamic = 'force-dynamic';
import { removeUser, editUser } from '@/controllers/userAdminController';
import { authenticate } from '@/middlewares/authMiddleware';
import { errorResponse } from '@/lib/apiResponse';

const requireAdmin = (request) => {
  const auth = authenticate(request);
  if (auth.error) return auth;
  if (auth.user.role.toLowerCase() !== 'admin') {
    return { error: errorResponse('Forbidden: Admin access required', 403) };
  }
  return auth;
};

export async function DELETE(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;
  
  const { id } = await params;
  if (!id) return errorResponse('User ID is required', 400);

  // Prevent admin from deleting themselves
  if (auth.user.id === id) {
    return errorResponse('Cannot delete your own account', 400);
  }

  return removeUser(id);
}

export async function PUT(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;
  
  const { id } = await params;
  if (!id) return errorResponse('User ID is required', 400);

  return editUser(id, request);
}
