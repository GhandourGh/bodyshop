import prisma from '@/lib/db';

export const getAllVehicles = async () => {
  return prisma.vehicles.findMany({
    include: {
      customers: {
        include: {
          users: { select: { name: true } }
        }
      }
    },
    orderBy: { id: 'desc' }
  });
};
