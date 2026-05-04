import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
  role: z.string().optional().default('customer'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const totpCompleteSchema = z.object({
  pendingToken: z.string().min(10),
  code: z.string().min(6).max(10),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16),
  password: z.string().min(8),
});

export const totpEnableSchema = z.object({
  secret: z.string().min(16),
  code: z.string().min(6).max(10),
});

export const totpDisableSchema = z.object({
  password: z.string().min(1),
  code: z.string().min(6).max(10),
});
