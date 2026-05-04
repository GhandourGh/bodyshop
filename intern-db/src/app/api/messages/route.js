export const dynamic = 'force-dynamic';
import { authenticate } from '@/middlewares/authMiddleware';
import { requireRole } from '@/middlewares/roleMiddleware';
import { createMessage } from '@/services/messageService';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import prisma from '@/lib/db';

export async function GET(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  const roleCheck = requireRole(auth.user, ['admin', 'mechanic']);
  if (roleCheck.error) return roleCheck.error;

  try {
    const rows = await prisma.messages.findMany({
      orderBy: { created_at: 'desc' },
      take: 100,
      include: {
        users: { select: { name: true, role: true } },
        jobs: {
          include: {
            customers: { include: { users: { select: { name: true } } } },
            vehicles:  { select: { make: true, model: true, year: true } },
          },
        },
      },
    });

    const data = rows.map(m => ({
      id:       m.id,
      jobId:    m.job_id,
      sender:   m.users?.name ?? 'System',
      role:     m.users?.role ?? 'system',
      channel:  m.channel ?? 'email',
      content:  m.content ?? '',
      created:  m.created_at,
      customer: m.jobs?.customers?.users?.name ?? '—',
      vehicle:  [m.jobs?.vehicles?.make, m.jobs?.vehicles?.model, m.jobs?.vehicles?.year].filter(Boolean).join(' ') || '—',
    }));

    return successResponse(data, 'Messages loaded');
  } catch (err) {
    return errorResponse(err.message || 'Failed to load messages', 500);
  }
}

export async function POST(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { jobId, messageType, customerName, jobDetails, language, channel } = body;

    if (!jobId || !customerName || !jobDetails) {
      return errorResponse('jobId, customerName, and jobDetails are required', 400);
    }

    const message = await createMessage({
      jobId,
      userId: auth.user.id,
      messageType,
      customerName,
      jobDetails,
      language,
      channel,
    });

    return successResponse(message, 'Message generated and saved', 201);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
