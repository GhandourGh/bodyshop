import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/db';
import { encryptSecret, decryptSecret } from '@/lib/credentialCrypto';

export async function listCredentials() {
  const rows = await prisma.integration_credentials.findMany({
    orderBy: { created_at: 'desc' },
    take: 200,
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    service_slug: r.service_slug,
    username_plain: r.username_plain,
    has_secret: Boolean(r.secret_encrypted),
    notes: r.notes,
    created_at: r.created_at,
    updated_at: r.updated_at,
    created_by_user_id: r.created_by_user_id,
  }));
}

/**
 * @param {{ name: string, service_slug: string, username_plain?: string|null, secret: string, notes?: string|null, created_by_user_id?: string|null }} data
 */
export async function createCredential(data) {
  const enc = encryptSecret(data.secret);
  return prisma.integration_credentials.create({
    data: {
      id: uuidv4(),
      name: data.name.trim(),
      service_slug: data.service_slug.trim().toLowerCase().slice(0, 64),
      username_plain: data.username_plain?.trim() || null,
      secret_encrypted: enc,
      notes: data.notes?.trim() || null,
      created_by_user_id: data.created_by_user_id || null,
    },
    select: {
      id: true,
      name: true,
      service_slug: true,
      username_plain: true,
      notes: true,
      created_at: true,
    },
  });
}

/**
 * @param {string} id
 * @param {{ name?: string, service_slug?: string, username_plain?: string|null, secret?: string, notes?: string|null }} patch
 */
export async function updateCredential(id, patch) {
  const data = {};
  if (patch.name != null) data.name = String(patch.name).trim();
  if (patch.service_slug != null) data.service_slug = String(patch.service_slug).trim().toLowerCase().slice(0, 64);
  if (patch.username_plain !== undefined) data.username_plain = patch.username_plain?.trim() || null;
  if (patch.notes !== undefined) data.notes = patch.notes?.trim() || null;
  if (patch.secret != null && String(patch.secret).length > 0) {
    data.secret_encrypted = encryptSecret(patch.secret);
  }
  if (Object.keys(data).length === 0) {
    const err = new Error('No changes provided');
    err.statusCode = 400;
    throw err;
  }
  data.updated_at = new Date();
  return prisma.integration_credentials.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      service_slug: true,
      username_plain: true,
      notes: true,
      updated_at: true,
    },
  });
}

export async function deleteCredential(id) {
  await prisma.integration_credentials.delete({ where: { id } });
}

/** Admin-only: reveal secret once (use sparingly). */
export async function revealCredentialSecret(id) {
  const row = await prisma.integration_credentials.findUnique({ where: { id } });
  if (!row) return null;
  try {
    return decryptSecret(row.secret_encrypted);
  } catch {
    return null;
  }
}
