import prisma from '@/lib/db';

/**
 * @param {{ limit?: number, integration_key?: string }} q
 */
export async function listIntegrationLogs(q = {}) {
  const limit = Math.min(Math.max(Number(q.limit) || 100, 1), 500);
  const key = q.integration_key?.trim();
  const where = key ? { integration_key: key } : {};
  return prisma.integration_logs.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take: limit,
  });
}
