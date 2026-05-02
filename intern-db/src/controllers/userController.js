import { getCurrentUser } from '@/services/userService';
import { authenticate } from '@/middlewares/authMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * GET /api/users/me
 * Protected — requires valid JWT
 */
export const getMe = async (request) => {
  try {
    // 1. Authenticate
    const auth = authenticate(request);
    if (auth.error) return auth.error;

    // 2. Fetch user
    const user = await getCurrentUser(auth.user.id);
    return successResponse(user, 'User profile retrieved');
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500);
  }
};
