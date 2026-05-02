import { getAllUsers, createUser, deleteUser, updateUser } from '@/services/userAdminService';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'mechanic', 'customer']),
});

export const listUsers = async () => {
  try {
    const data = await getAllUsers();
    return successResponse(data, 'Users retrieved successfully');
  } catch (err) {
    return errorResponse(err.message, 500);
  }
};

export const addUser = async (request) => {
  try {
    const body = await request.json();
    const result = createUserSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Validation failed', 400, result.error.flatten().fieldErrors);
    }

    const data = await createUser(result.data);
    return successResponse(data, 'User created successfully', 201);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500);
  }
};

export const removeUser = async (id) => {
  try {
    await deleteUser(id);
    return successResponse(null, 'User deleted successfully');
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500);
  }
};

export const editUser = async (id, request) => {
  try {
    const body = await request.json();
    const data = await updateUser(id, body);
    return successResponse(data, 'User updated successfully');
  } catch (err) {
    return errorResponse(err.message, 400);
  }
};
