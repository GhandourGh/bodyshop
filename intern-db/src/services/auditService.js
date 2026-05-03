import { createAuditLog, getAuditLogs } from '@/repositories/auditRepository';

// Never throws — audit must never crash a parent request
export const logAudit = async ({ userId, action, entity, entityId } = {}) => {
  try {
    await createAuditLog({ userId, action, entity, entityId });
  } catch {
    // silently swallow — audit is fire-and-forget
  }
};

export const listAuditLogs = async (opts) => {
  const rows = await getAuditLogs(opts);
  return rows.map(r => ({
    id: r.id,
    timestamp: r.created_at,
    actor: r.users?.name || 'System',
    actorRole: r.users?.role || null,
    action: r.action || 'ACTION',
    entity: r.entity || '—',
    entityId: r.entity_id,
  }));
};
