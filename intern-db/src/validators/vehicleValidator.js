import { z } from 'zod';

// TODO: implement in vehicles step

export const createVehicleSchema = z.object({
  customerId: z.string().uuid(),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1886),
  plate: z.string().min(1),
  vin: z.string().optional(),
});
