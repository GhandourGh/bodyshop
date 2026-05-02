import prisma from '@/lib/db';

export const getAllPredictions = async () => {
  return prisma.ai_predictions.findMany({
    include: {
      jobs: {
        select: { id: true, status: true, vehicles: { select: { make: true, model: true } } }
      }
    },
    orderBy: { created_at: 'desc' }
  });
};
