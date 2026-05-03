import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const createAuditLog = async ({ userId, action, entity, entityId }) => {
  return prisma.audit_logs.create({
    data: {
      id: uuidv4(),
      user_id: userId || null,
      action: action || null,
      entity: entity || null,
      entity_id: entityId || null,
    },
  });
};

export const getAuditLogs = async ({ limit = 100, entity } = {}) => {
  return prisma.audit_logs.findMany({
    where: entity ? { entity: { contains: entity, mode: 'insensitive' } } : undefined,
    include: { users: { select: { name: true, role: true } } },
    orderBy: { created_at: 'desc' },
    take: Math.min(limit, 500),
  });
};
