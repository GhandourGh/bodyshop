import prisma from '@/lib/db';

export const getAllMechanics = async () => {
  return prisma.mechanics.findMany({
    include: {
      users: { select: { name: true, email: true } }
    },
    orderBy: { id: 'asc' }
  });
};
