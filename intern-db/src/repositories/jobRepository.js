import prisma from '@/lib/db';

export const getAllJobs = async () => {
  return prisma.jobs.findMany({
    include: {
      customers: {
        include: { users: { select: { name: true } } }
      },
      vehicles: { select: { make: true, model: true, year: true, vin: true } },
    },
    orderBy: { created_at: 'desc' }
  });
};
