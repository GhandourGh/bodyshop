import { z } from 'zod';

// TODO: implement in jobs step

export const createJobSchema = z.object({
  vehicleId: z.string().uuid(),
  customerId: z.string().uuid(),
  estimatedCost: z.number().positive().optional(),
  estimatedTime: z.number().positive().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE']),
});

export const assignMechanicSchema = z.object({
  mechanicId: z.string().uuid(),
});
