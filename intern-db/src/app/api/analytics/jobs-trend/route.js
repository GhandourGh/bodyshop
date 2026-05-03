export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticate } from '@/middlewares/authMiddleware';

export async function GET(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  try {
    const jobs = await prisma.jobs.findMany({
      select: { id: true, status: true, created_at: true },
      where: { created_at: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } },
      orderBy: { created_at: 'asc' },
    });

    // Group by month (last 12)
    const now = new Date();
    const buckets = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        month: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        total: 0, pending: 0, in_progress: 0, done: 0,
      });
    }

    for (const j of jobs) {
      if (!j.created_at) continue;
      const key = `${j.created_at.getFullYear()}-${String(j.created_at.getMonth() + 1).padStart(2, '0')}`;
      const b = buckets.find(x => x.key === key);
      if (!b) continue;
      b.total++;
      if (j.status === 'pending') b.pending++;
      else if (j.status === 'in_progress') b.in_progress++;
      else if (j.status === 'done') b.done++;
    }

    return NextResponse.json({ data: buckets.map(({ key: _, ...rest }) => rest) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
