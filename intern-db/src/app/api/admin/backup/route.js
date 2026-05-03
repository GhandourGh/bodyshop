export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticate } from '@/middlewares/authMiddleware';
import { requireRole } from '@/middlewares/roleMiddleware';

export async function GET(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  const rc = requireRole(auth.user, ['admin']);
  if (rc.error) return rc.error;

  try {
    const [jobs, customers, vehicles, mechanics, parts, messages] = await Promise.all([
      prisma.jobs.findMany({ include: { customers: { include: { users: { select: { name: true, email: true } } } }, vehicles: true } }),
      prisma.customers.findMany({ include: { users: { select: { id: true, name: true, email: true, role: true, created_at: true } } } }),
      prisma.vehicles.findMany(),
      prisma.mechanics.findMany({ include: { users: { select: { id: true, name: true, email: true } } } }),
      prisma.parts.findMany(),
      prisma.messages.findMany({ orderBy: { created_at: 'desc' }, take: 500 }),
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      counts: { jobs: jobs.length, customers: customers.length, vehicles: vehicles.length, mechanics: mechanics.length, parts: parts.length, messages: messages.length },
      data: { jobs, customers, vehicles, mechanics, parts, messages },
    };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="autoforge-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
