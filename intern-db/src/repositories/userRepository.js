import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Find a user by their email address.
 * @param {string} email
 */
export const findUserByEmail = async (email) => {
  return prisma.users.findUnique({ where: { email } });
};

/** Full row for auth (includes password_hash, totp fields). */
export const findCredentialUserByEmail = async (email) => {
  return prisma.users.findUnique({ where: { email } });
};

/**
 * @param {string} id
 * @param {object} data — Prisma users update input
 */
export const updateUserById = async (id, data) => {
  return prisma.users.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      created_at: true,
      totp_enabled: true,
    },
  });
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
      totp_enabled: true,
      created_at: true,
      customers: true,
    },
  });
};

/** Full row for TOTP disable / internal auth. */
export const findCredentialUserById = async (id) => {
  return prisma.users.findUnique({ where: { id } });
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
