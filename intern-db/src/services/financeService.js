import prisma from '@/lib/db';

export const getFinanceSummary = async () => {
  const jobs = await prisma.jobs.findMany({
    select: {
      id: true,
      status: true,
      estimated_cost: true,
      created_at: true,
      customers: { include: { users: { select: { name: true } } } },
      vehicles: { select: { make: true, model: true, year: true } },
      mechanics: { include: { users: { select: { name: true } } } },
    },
    orderBy: { created_at: 'desc' },
  });

  // Build invoice list from real jobs
  const invoices = jobs.map((job, i) => ({
    id: `INV-${new Date(job.created_at).getFullYear()}${String(i + 1).padStart(3, '0')}`,
    jobId: job.id,
    customer: job.customers?.users?.name || 'Unknown',
    vehicle: job.vehicles
      ? `${job.vehicles.year || ''} ${job.vehicles.make || ''} ${job.vehicles.model || ''}`.trim()
      : 'Unknown',
    mechanic: job.mechanics?.users?.name || 'Unassigned',
    amount: job.estimated_cost ? Number(job.estimated_cost) : 0,
    status: job.status === 'done' ? 'paid' : job.status === 'in_progress' ? 'pending' : 'draft',
    date: job.created_at ? job.created_at.toISOString().slice(0, 10) : '',
  }));

  // Monthly revenue: group done jobs by year-month (last 12 months)
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
      revenue: 0,
      jobs: 0,
    });
  }

  for (const job of jobs) {
    if (!job.created_at || !job.estimated_cost) continue;
    const key = `${job.created_at.getFullYear()}-${String(job.created_at.getMonth() + 1).padStart(2, '0')}`;
    const bucket = months.find(m => m.key === key);
    if (bucket) {
      bucket.revenue += Number(job.estimated_cost);
      bucket.jobs += 1;
    }
  }

  const monthlyRevenue = months.map(({ label, revenue, jobs: jobCount }) => ({
    month: label,
    revenue: Math.round(revenue),
    jobs: jobCount,
  }));

  const totalRevenue = invoices.reduce((s, inv) => s + inv.amount, 0);
  const totalPaid    = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const totalDraft   = invoices.filter(i => i.status === 'draft').reduce((s, i) => s + i.amount, 0);

  return { invoices, monthlyRevenue, totals: { totalRevenue, totalPaid, totalPending, totalDraft } };
};
