import { z } from 'zod';

// TODO: implement in AI step

export const createPredictionSchema = z.object({
  jobId: z.string().uuid(),
  type: z.enum(['cost', 'time', 'mechanic', 'parts']),
  prediction: z.record(z.unknown()), // structured JSON only
});
