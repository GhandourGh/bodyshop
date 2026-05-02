import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Find a user by their email address.
 * @param {string} email
 */
export const findUserByEmail = async (email) => {
  return prisma.users.findUnique({ where: { email } });
};

/**
 * Find a user by their ID (excludes password).
 * @param {string} id
 */
export const findUserById = async (id) => {
  return prisma.users.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      created_at: true,
      customers: true,
    },
  });
};

/**
 * Create a new user.
 * @param {{ email: string, password_hash: string, role?: string, name: string }} data
 */
export const createUser = async (data) => {
  return prisma.users.create({
    data: {
      id: uuidv4(),
      ...data,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      created_at: true,
    },
  });
};
