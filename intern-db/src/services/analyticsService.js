// Version 2.1 - Fixed Syntax Error
import prisma from '@/lib/db';

export const getOverviewStats = async () => {
  const [totalJobs, pendingJobs, totalVehicles, totalParts] = await Promise.all([
    prisma.jobs.count(),
    prisma.jobs.count({ where: { status: 'pending' } }),
    prisma.vehicles.count(),
    prisma.parts.count()
  ]);

  const recentActivity = await prisma.jobs.findMany({
    take: 5,
    orderBy: { created_at: 'desc' },
    include: {
      vehicles: { select: { make: true, model: true } }
    }
  });

  return {
    totalJobs,
    pendingJobs,
    totalVehicles,
    totalParts,
    recentActivity: recentActivity.map(j => ({
      id: j.id,
      text: `New job created for ${j.vehicles ? j.vehicles.make + ' ' + j.vehicles.model : 'Unknown Vehicle'}`,
      time: j.created_at
    })),
    recentAiPredictions: (await prisma.ai_predictions.findMany({
      take: 3,
      orderBy: { created_at: 'desc' },
      include: { jobs: { include: { vehicles: true } } }
    })).map(p => ({
      id: p.id,
      type: p.type,
      confidence: (p.confidence * 100).toFixed(0) + '%',
      vehicle: p.jobs?.vehicles ? `${p.jobs.vehicles.make} ${p.jobs.vehicles.model}` : 'Unknown',
      result: p.result
    }))
  };
};
