import { z } from 'zod';

// TODO: implement in customers step

export const createCustomerSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
});
