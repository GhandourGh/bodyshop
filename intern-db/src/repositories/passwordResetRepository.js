import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const deleteTokensForUser = async (userId) => {
  await prisma.password_reset_tokens.deleteMany({ where: { user_id: userId } });
};

/**
 * @param {string} userId
 * @param {string} tokenHash — sha256 hex of raw token
 * @param {Date} expiresAt
 */
export const createResetToken = async (userId, tokenHash, expiresAt) => {
  await prisma.password_reset_tokens.create({
    data: {
      id: uuidv4(),
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    },
  });
};

/** @param {string} tokenHash */
export const findValidToken = async (tokenHash) => {
  return prisma.password_reset_tokens.findFirst({
    where: {
      token_hash: tokenHash,
      expires_at: { gt: new Date() },
    },
    include: { users: true },
  });
};

export const deleteTokenById = async (id) => {
  await prisma.password_reset_tokens.delete({ where: { id } });
};
