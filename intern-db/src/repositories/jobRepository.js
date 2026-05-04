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

/** Full job row for detail views (staff or portal). */
export const getJobById = async (id) => {
  return prisma.jobs.findUnique({
    where: { id },
    include: {
      customers: {
        include: { users: { select: { id: true, name: true, email: true } } },
      },
      vehicles: { select: { id: true, make: true, model: true, year: true, vin: true } },
      damage_reports: {
        orderBy: { created_at: 'desc' },
        take: 20,
      },
    },
  });
};
