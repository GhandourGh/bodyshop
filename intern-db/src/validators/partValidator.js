import { z } from 'zod';

// TODO: implement in parts step

export const createPartSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  stock: z.number().int().min(0),
  price: z.number().positive(),
});

export const updateStockSchema = z.object({
  quantity: z.number().int(),
});
