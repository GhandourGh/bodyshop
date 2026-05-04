import { z } from 'zod';

export const createCredentialSchema = z.object({
  name: z.string().trim().min(1).max(120),
  service_slug: z.string().trim().min(1).max(64),
  username_plain: z.string().trim().max(500).optional().nullable(),
  secret: z.string().min(1).max(8000),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const patchCredentialSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  service_slug: z.string().trim().min(1).max(64).optional(),
  username_plain: z.string().trim().max(500).optional().nullable(),
  secret: z.string().min(1).max(8000).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
});
