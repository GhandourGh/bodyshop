export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticate } from '@/middlewares/authMiddleware';

export async function GET(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  try {
    const mechanics = await prisma.mechanics.findMany({
      include: {
        users: { select: { name: true } },
        jobs: { select: { estimated_cost: true, estimated_time: true, status: true } },
      },
    });

    const data = mechanics.map(m => {
      const jobs = m.jobs || [];
      const totalJobs = jobs.length;
      const doneJobs = jobs.filter(j => j.status === 'done').length;
      const avgCost = totalJobs
        ? Math.round(jobs.reduce((s, j) => s + (j.estimated_cost ? Number(j.estimated_cost) : 0), 0) / totalJobs)
        : 0;
      const avgHours = totalJobs
        ? Math.round(jobs.reduce((s, j) => s + (j.estimated_time || 0), 0) / totalJobs)
        : 0;
      return {
        name: m.users?.name || 'Unknown',
        totalJobs,
        doneJobs,
        avgCost,
        avgHours,
        skillLevel: m.skill_level,
        workload: Math.round((m.workload || 0) * 100),
      };
    }).sort((a, b) => b.totalJobs - a.totalJobs);

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
