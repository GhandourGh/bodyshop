export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticate } from '@/middlewares/authMiddleware';

export async function GET(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  try {
    const predictions = await prisma.ai_predictions.findMany({
      include: {
        jobs: {
          include: {
            vehicles: { select: { make: true, model: true, year: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 200,
    });

    const rows = predictions.map(p => {
      const job = p.jobs;
      const result = p.result || {};
      const predictedCost  = result.predictedCost  ?? result.predicted_cost_usd  ?? null;
      const predictedHours = result.predictedHours ?? result.predicted_hours      ?? null;
      const actualCost     = job?.estimated_cost   ? Number(job.estimated_cost)   : null;
      const actualHours    = job?.estimated_time   ?? null;

      const costError  = predictedCost  != null && actualCost  != null && actualCost  > 0
        ? Math.abs((predictedCost  - actualCost)  / actualCost)  : null;
      const hoursError = predictedHours != null && actualHours != null && actualHours > 0
        ? Math.abs((predictedHours - actualHours) / actualHours) : null;

      return {
        id: p.id,
        jobId: p.job_id,
        type: p.type,
        vehicle: job?.vehicles
          ? `${job.vehicles.year || ''} ${job.vehicles.make || ''} ${job.vehicles.model || ''}`.trim()
          : 'Unknown',
        predictedCost:  predictedCost  != null ? Math.round(predictedCost)      : null,
        actualCost:     actualCost     != null ? Math.round(actualCost)          : null,
        predictedHours: predictedHours != null ? Number(predictedHours.toFixed(1)) : null,
        actualHours:    actualHours,
        costError:      costError  != null ? Math.round(costError  * 100) : null,
        hoursError:     hoursError != null ? Math.round(hoursError * 100) : null,
        confidence:     p.confidence,
        createdAt:      p.created_at,
      };
    }).filter(r => r.predictedCost != null || r.predictedHours != null);

    // Summary stats
    const withCostError  = rows.filter(r => r.costError  != null);
    const withHoursError = rows.filter(r => r.hoursError != null);
    const avgCostError   = withCostError.length  ? Math.round(withCostError.reduce( (s, r) => s + r.costError,  0) / withCostError.length)  : null;
    const avgHoursError  = withHoursError.length ? Math.round(withHoursError.reduce((s, r) => s + r.hoursError, 0) / withHoursError.length) : null;

    return NextResponse.json({ rows, summary: { total: rows.length, avgCostError, avgHoursError } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
