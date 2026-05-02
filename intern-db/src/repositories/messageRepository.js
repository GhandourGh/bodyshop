import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const createMessage = async ({ jobId, userId, channel, content }) => {
  return prisma.messages.create({
    data: {
      id: uuidv4(),
      job_id: jobId,
      user_id: userId || null,
      channel: channel || 'email',
      content,
    }
  });
};

export const findMessagesByJobId = async (jobId) => {
  return prisma.messages.findMany({
    where: { job_id: jobId },
    include: { users: { select: { name: true, role: true } } },
    orderBy: { created_at: 'desc' }
  });
};
