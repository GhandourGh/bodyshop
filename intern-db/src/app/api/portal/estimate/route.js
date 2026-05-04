export const dynamic = 'force-dynamic';

import { v4 as uuidv4 } from 'uuid';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { getAiServiceUrl, getAiHeaders } from '@/lib/aiFetch';
import { checkPortalRateLimit } from '@/lib/portalRateLimit';
import { portalEstimateSchema } from '@/validators/portalEstimateValidator';
import { tryAuthenticate } from '@/middlewares/authMiddleware';
import prisma from '@/lib/db';
import { appendIntegrationLog } from '@/services/integrationLogService';

function clientIp(request) {
  const xf = request.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim() || 'unknown';
  return request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request) {
  const ip = clientIp(request);
  if (!checkPortalRateLimit(ip)) {
    return errorResponse('Too many requests. Try again later.', 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const parsed = portalEstimateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('Validation failed', 400, parsed.error.flatten().fieldErrors);
  }

  const payload = parsed.data;
  const { user } = tryAuthenticate(request);
  const isCustomer = user && (user.role || '').toLowerCase() === 'customer';

  if (payload.saveLead && !payload.email?.trim() && !isCustomer) {
    return errorResponse('Email is required when saving your request (or sign in as a customer).', 400);
  }
  const AI_URL = getAiServiceUrl();
  const headers = getAiHeaders();

  const estimateInput = {
    vehicle_type: payload.vehicle_type,
    damage_type: payload.damage_type,
    severity: payload.severity,
    parts_count: payload.parts_count,
    mechanic_skill: payload.mechanic_skill,
  };

  try {
    const t0 = Date.now();
    const [timeRes, costRes] = await Promise.all([
      fetch(`${AI_URL}/predict-time`, {
        method: 'POST',
        headers,
        body: JSON.stringify(estimateInput),
      }),
      fetch(`${AI_URL}/predict-cost`, {
        method: 'POST',
        headers,
        body: JSON.stringify(estimateInput),
      }),
    ]);
    const elapsed = Date.now() - t0;

    if (!timeRes.ok || !costRes.ok) {
      const t = timeRes.ok ? '' : await timeRes.text();
      const c = costRes.ok ? '' : await costRes.text();
      const raw = [t, c].filter(Boolean).join('');
      let detail = raw.slice(0, 300);
      try {
        const parts = [t, c].filter(Boolean);
        const parsed = parts.map((p) => {
          try {
            return JSON.parse(p);
          } catch {
            return null;
          }
        });
        const d0 = parsed[0]?.detail;
        if (d0 && parsed.every((p) => !p || p.detail === d0)) detail = String(d0);
      } catch {
        /* keep raw */
      }
      const hint =
        /invalid or missing api key/i.test(detail)
          ? ' Set AI_API_KEY in intern-db/.env (same value as FastAPI) or define it in the repo-root .env for local dev.'
          : '';
      appendIntegrationLog({
        integration_key: 'portal_estimate_ai',
        status: 'error',
        message: `predict-time/cost failed: ${detail}`.slice(0, 1900),
        duration_ms: elapsed,
        meta: { vehicle_type: payload.vehicle_type, damage_type: payload.damage_type },
      });
      return errorResponse(`AI service unavailable${detail ? `: ${detail}` : ''}.${hint}`, 502);
    }

    const timeData = await timeRes.json();
    const costData = await costRes.json();

    appendIntegrationLog({
      integration_key: 'portal_estimate_ai',
      status: 'ok',
      message: 'predict-time + predict-cost completed',
      duration_ms: elapsed,
      meta: {
        vehicle_type: payload.vehicle_type,
        damage_type: payload.damage_type,
        hours: timeData.predicted_hours,
        cost_usd: costData.predicted_cost_usd,
      },
    });

    const result = {
      predicted_hours: timeData.predicted_hours,
      predicted_cost_usd: costData.predicted_cost_usd,
      inputs: estimateInput,
    };

    const userIdForLead = isCustomer ? user.id : null;
    const emailForLead = payload.email?.trim().toLowerCase() || (isCustomer ? user.email?.trim().toLowerCase() : null) || null;

    if (payload.saveLead) {
      await prisma.booking_inquiries.create({
        data: {
          id: uuidv4(),
          user_id: userIdForLead,
          name: payload.name?.trim() || null,
          email: emailForLead,
          phone: payload.phone?.trim() || null,
          payload: {
            inputs: estimateInput,
            estimate: result,
            savedAt: new Date().toISOString(),
          },
        },
      });
    }

    return successResponse(
      {
        ...result,
        leadSaved: Boolean(payload.saveLead),
      },
      payload.saveLead ? 'Estimate saved — we will follow up.' : 'Estimate ready'
    );
  } catch (err) {
    return errorResponse(err.message || 'Estimate failed', 500);
  }
}
