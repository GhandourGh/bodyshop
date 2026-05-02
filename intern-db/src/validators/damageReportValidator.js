import { z } from 'zod';

// TODO: implement in damage-reports step

export const createDamageReportSchema = z.object({
  jobId: z.string().uuid(),
  imageUrl: z.string().url(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  notes: z.string().optional(),
});
