import { z } from 'zod';

// TODO: implement in messages step

export const createMessageSchema = z.object({
  jobId: z.string().uuid(),
  channel: z.enum(['EMAIL', 'SMS']),
  content: z.string().min(1),
});
