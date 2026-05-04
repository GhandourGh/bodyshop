import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/db';

/**
 * Append a row to integration_logs (never throws to callers).
 * @param {{ integration_key: string, status: string, message?: string, duration_ms?: number|null, meta?: object }} row
 */
export async function appendIntegrationLog(row) {
  try {
    await prisma.integration_logs.create({
      data: {
        id: uuidv4(),
        integration_key: String(row.integration_key || 'unknown').slice(0, 120),
        status: String(row.status || 'unknown').slice(0, 32),
        message: row.message != null ? String(row.message).slice(0, 4000) : null,
        duration_ms: row.duration_ms ?? null,
        meta: row.meta ?? undefined,
      },
    });
  } catch (e) {
    console.error('[integration_logs] append failed', e);
  }
}
