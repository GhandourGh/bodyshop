import { z } from 'zod';

export const portalEstimateSchema = z.object({
  vehicle_type: z.enum(['sedan', 'suv', 'truck', 'hatchback', 'luxury', 'van']),
  damage_type: z.enum(['dent', 'scratch', 'crack', 'paint', 'multiple']),
  severity: z.coerce.number().min(0).max(1),
  parts_count: z.coerce.number().int().min(1).max(20).optional().default(3),
  mechanic_skill: z.coerce.number().int().min(1).max(5).optional().default(3),
  saveLead: z.boolean().optional().default(false),
  name: z.string().max(200).optional().nullable(),
  email: z.preprocess(
    (v) => (v === '' || v == null ? undefined : String(v).trim()),
    z.string().email().optional()
  ),
  phone: z.string().max(50).optional().nullable(),
});
