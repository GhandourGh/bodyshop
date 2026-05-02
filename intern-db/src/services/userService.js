import { findUserById } from '@/repositories/userRepository';

/**
 * Returns the full profile of the currently authenticated user.
 * @param {string} userId
 */
export const getCurrentUser = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return user;
};
