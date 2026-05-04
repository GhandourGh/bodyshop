export const dynamic = 'force-dynamic';

import { authenticate } from '@/middlewares/authMiddleware';
import { requireRole } from '@/middlewares/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { patchCredentialSchema } from '@/validators/credentialVaultValidator';
import { updateCredential, deleteCredential } from '@/services/credentialVaultService';

export async function PATCH(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  const rc = requireRole(auth.user, ['admin']);
  if (rc.error) return rc.error;
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }
  const parsed = patchCredentialSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('Validation failed', 400, parsed.error.flatten().fieldErrors);
  }
  try {
    const row = await updateCredential(id, parsed.data);
    return successResponse(row, 'Credential updated');
  } catch (e) {
    const msg = e?.message || 'Update failed';
    const code = msg.includes('No changes') ? 400 : 404;
    return errorResponse(msg, code);
  }
}

export async function DELETE(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  const rc = requireRole(auth.user, ['admin']);
  if (rc.error) return rc.error;
  const { id } = await params;
  try {
    await deleteCredential(id);
    return successResponse(null, 'Deleted');
  } catch (e) {
    return errorResponse(e.message || 'Not found', 404);
  }
}
