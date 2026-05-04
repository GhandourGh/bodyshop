import { z } from 'zod';
import crypto from 'crypto';
import { getCustomers } from '@/services/customerService';
import { createUser } from '@/services/userAdminService';
import { successResponse, errorResponse } from '@/lib/apiResponse';

const createCustomerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().toLowerCase().email('Valid email required'),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v ? v : undefined)),
  password: z.string().min(8).optional(),
});

export const listCustomers = async () => {
  try {
    const data = await getCustomers();
    return successResponse(data, 'Customers retrieved successfully');
  } catch (err) {
    return errorResponse(err.message, 500);
  }
};

export const addCustomer = async (request) => {
  try {
    const body = await request.json();
    const parsed = createCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.flatten().fieldErrors);
    }

    const { name, email, phone, password } = parsed.data;
    const generatedPassword = password || `tmp-${crypto.randomBytes(8).toString('hex')}`;

    const user = await createUser({
      name,
      email,
      phone,
      password: generatedPassword,
      role: 'customer',
    });

    const customerRow = Array.isArray(user.customers) ? user.customers[0] : user.customers;
    return successResponse(
      {
        id: customerRow?.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: customerRow?.phone || null,
        created_at: user.created_at,
        // Only echo back the temp password if we generated it ourselves.
        temporaryPassword: password ? undefined : generatedPassword,
      },
      'Customer created successfully',
      201
    );
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500);
  }
};
