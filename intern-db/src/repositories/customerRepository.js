import prisma from '@/lib/db';

export const getAllCustomers = async () => {
  return prisma.customers.findMany({
    include: {
      users: {
        select: { name: true, email: true, created_at: true }
      }
    },
    orderBy: { id: 'asc' }
  });
};
