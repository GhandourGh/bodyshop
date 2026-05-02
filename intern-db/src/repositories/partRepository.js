import prisma from '@/lib/db';

export const getAllParts = async () => {
  return prisma.parts.findMany({
    orderBy: { name: 'asc' }
  });
};
