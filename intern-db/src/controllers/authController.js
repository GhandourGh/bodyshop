import { registerUser, loginUser } from '@/services/authService';
import { registerSchema, loginSchema } from '@/validators/authValidator';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * POST /api/auth/register
 */
export const register = async (request) => {
  try {
    const body = await request.json();

    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Validation failed', 400, result.error.flatten().fieldErrors);
    }

    const user = await registerUser(result.data);
    return successResponse(user, 'User registered successfully', 201);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500);
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (request) => {
  try {
    const body = await request.json();

    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Validation failed', 400, result.error.flatten().fieldErrors);
    }

    const data = await loginUser(result.data);
    return successResponse(data, 'Login successful');
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500);
  }
};
