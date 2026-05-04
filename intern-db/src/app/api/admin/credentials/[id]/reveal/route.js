export const dynamic = 'force-dynamic';

import { authenticate } from '@/middlewares/authMiddleware';
import { requireRole } from '@/middlewares/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { revealCredentialSecret } from '@/services/credentialVaultService';

/**
 * POST /api/admin/credentials/[id]/reveal — admin only; returns decrypted secret once.
 */
export async function POST(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  const rc = requireRole(auth.user, ['admin']);
  if (rc.error) return rc.error;
  const { id } = await params;
  let body = {};
  try {
    body = await request.json();
  } catch {
    /* optional body */
  }
  if (body.confirm !== true) {
    return errorResponse('Send JSON { "confirm": true } to reveal the secret.', 400);
  }
  const secret = await revealCredentialSecret(id);
  if (secret == null) {
    return errorResponse('Credential not found or could not be decrypted', 404);
  }
  return successResponse({ secret }, 'Secret revealed — copy now; not logged.');
}
