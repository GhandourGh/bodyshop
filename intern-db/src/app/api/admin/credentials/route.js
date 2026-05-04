export const dynamic = 'force-dynamic';

import { authenticate } from '@/middlewares/authMiddleware';
import { requireRole } from '@/middlewares/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { createCredentialSchema } from '@/validators/credentialVaultValidator';
import { listCredentials, createCredential } from '@/services/credentialVaultService';

export async function GET(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  const rc = requireRole(auth.user, ['admin']);
  if (rc.error) return rc.error;
  try {
    const data = await listCredentials();
    return successResponse(data, 'Credentials listed');
  } catch (e) {
    return errorResponse(e.message || 'Failed', 500);
  }
}

export async function POST(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  const rc = requireRole(auth.user, ['admin']);
  if (rc.error) return rc.error;
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }
  const parsed = createCredentialSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('Validation failed', 400, parsed.error.flatten().fieldErrors);
  }
  try {
    const row = await createCredential({
      ...parsed.data,
      created_by_user_id: auth.user.id,
    });
    return successResponse(row, 'Credential stored', 201);
  } catch (e) {
    return errorResponse(e.message || 'Failed to save', 500);
  }
}
