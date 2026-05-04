import * as aiRepo from '@/repositories/aiRepository';
import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { getAiServiceUrl, getAiHeaders } from '@/lib/aiFetch';

export const getPredictions = async () => {
  const preds = await aiRepo.getAllPredictions();
  return preds.map(p => ({
    id: p.id,
    jobId: p.job_id,
    vehicle: p.jobs?.vehicles ? `${p.jobs.vehicles.make} ${p.jobs.vehicles.model}` : 'Unknown',
    type: p.type || 'Damage Assessment',
    confidence: p.confidence ? (p.confidence * 100).toFixed(1) + '%' : 'N/A',
    result: p.result || {},
    created: p.created_at
  }));
};

// Fetch full job record with vehicle + mechanics for AI context
const getJobContext = async (jobId) => {
  return prisma.jobs.findUnique({
    where: { id: jobId },
    include: {
      vehicles: true,
      customers: { include: { users: { select: { name: true } } } },
    }
  });
};

// Derive vehicle_type string our model understands from DB vehicle record
const deriveVehicleType = (vehicle) => {
  if (!vehicle) return 'sedan';
  const make = (vehicle.make || '').toLowerCase();
  const model = (vehicle.model || '').toLowerCase();
  if (['f-150', 'silverado', 'ram', 'tundra', 'tacoma', 'ranger'].some(t => model.includes(t))) return 'truck';
  if (['rav4', 'cr-v', 'x5', 'q7', 'explorer', 'pilot', 'highlander', 'escalade', 'navigator'].some(t => model.includes(t))) return 'suv';
  if (['transit', 'sprinter', 'odyssey', 'sienna', 'caravan'].some(t => model.includes(t))) return 'van';
  if (['mercedes', 'bmw', 'audi', 'lexus', 'cadillac', 'porsche', 'jaguar', 'bentley'].some(t => make.includes(t))) return 'luxury';
  if (['golf', 'fit', 'yaris', 'fiesta', 'polo', 'swift'].some(t => model.includes(t))) return 'hatchback';
  return 'sedan';
};

export const processAi = async (jobId, type) => {
  const AI_URL = getAiServiceUrl();
  const jsonHeaders = getAiHeaders();
  const forecastHeaders = getAiHeaders({ jsonContentType: false });

  const job = await getJobContext(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  // Pull severity from the latest damage report on this job (fallback 0.5)
  const latestDamage = await prisma.damage_reports.findFirst({
    where: { job_id: jobId },
    orderBy: { created_at: 'desc' }
  });
  const severity = latestDamage?.severity != null
    ? Math.min(latestDamage.severity / 10, 1.0)  // DB stores 1-10, model expects 0-1
    : 0.5;

  const vehicleType = deriveVehicleType(job.vehicles);

  let result = {};
  let confidence = 0.85;

  if (type === 'Cost Estimation') {
    const payload = {
      vehicle_type: vehicleType,
      damage_type: 'dent',
      severity,
      parts_count: 3,
      mechanic_skill: 3,
    };

    const [costRes, timeRes] = await Promise.all([
      fetch(`${AI_URL}/predict-cost`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      }),
      fetch(`${AI_URL}/predict-time`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      }),
    ]);

    if (!costRes.ok || !timeRes.ok) throw new Error('AI cost/time service unavailable');

    const costData = await costRes.json();
    const timeData = await timeRes.json();

    result = {
      predicted_cost_usd: costData.predicted_cost_usd,
      predicted_hours: timeData.predicted_hours,
      vehicle_type: vehicleType,
      severity_used: severity,
    };
    confidence = 0.87;

    // Write estimates back to the job record
    await prisma.jobs.update({
      where: { id: jobId },
      data: {
        estimated_cost: costData.predicted_cost_usd,
        estimated_time: Math.round(timeData.predicted_hours),
      }
    });

  } else if (type === 'Mechanic Recommendation') {
    const res = await fetch(`${AI_URL}/assign-mechanic`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        job_type: 'body_repair',
        required_skill: 3,
        estimated_hours: job.estimated_time || 4,
      }),
    });

    if (!res.ok) throw new Error('AI mechanic service unavailable');
    const data = await res.json();

    result = { ranked_mechanics: data.ranked_mechanics };
    // ranker scores are unbounded — normalize top score to 0–1 range
    const topScore = data.ranked_mechanics?.[0]?.score ?? 0.85;
    confidence = Math.min(Math.max(topScore / 5, 0), 1);

    // Assign top mechanic to the job — write the mechanics.id (not users.id)
    if (data.ranked_mechanics?.length > 0) {
      const topName = data.ranked_mechanics[0].name;
      const matchingMechanic = await prisma.mechanics.findFirst({
        where: { users: { is: { name: topName, role: 'mechanic' } } },
        select: { id: true },
      });
      if (matchingMechanic) {
        await prisma.jobs.update({
          where: { id: jobId },
          data: { assigned_mechanic_id: matchingMechanic.id },
        });
      }
    }

  } else if (type === 'Inventory Forecast') {
    const categories = ['bumpers', 'headlights', 'body-panels', 'mirrors', 'windshields'];
    const forecasts = await Promise.all(
      categories.map(cat =>
        fetch(`${AI_URL}/forecast-inventory?part_category=${cat}&days=30`, {
          headers: forecastHeaders,
        }).then(r => r.ok ? r.json() : null)
      )
    );

    result = {
      forecasts: forecasts
        .filter(Boolean)
        .map(f => ({
          category: f.part_category,
          forecast_units: f.forecast_units,
          daily_avg: f.daily_avg,
          low_stock_alert: f.low_stock_alert,
        })),
    };
    confidence = 0.82;

  } else {
    // Damage Assessment — no image available from trigger flow;
    // return contextual summary from job + damage report
    result = {
      note: 'Upload a car photo via /predict-damage for full detection.',
      severity_on_record: severity,
      vehicle: job.vehicles ? `${job.vehicles.year} ${job.vehicles.make} ${job.vehicles.model}` : 'Unknown',
      damage_notes: latestDamage?.notes || 'No damage report filed yet.',
    };
    confidence = 0.6;
  }

  const prediction = await prisma.ai_predictions.create({
    data: {
      id: uuidv4(),
      job_id: jobId,
      type,
      result,
      confidence,
      created_at: new Date(),
    }
  });

  return prediction;
};
