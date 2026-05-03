import * as jobRepo from '@/repositories/jobRepository';
import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '@/services/auditService';

async function mechanicNameForJob(assignedMechanicId) {
  if (!assignedMechanicId) return null;
  const m = await prisma.mechanics.findUnique({
    where: { id: assignedMechanicId },
    include: { users: { select: { name: true } } },
  });
  return m?.users?.name ?? null;
}

export function serializeJobDetail(j, mechanicName) {
  const vehicleLabel = j.vehicles
    ? `${j.vehicles.year ?? ''} ${j.vehicles.make ?? ''} ${j.vehicles.model ?? ''}`.trim() || 'Unknown'
    : 'Unknown';
  return {
    id: j.id,
    status: j.status,
    estimatedCost: j.estimated_cost != null ? Number(j.estimated_cost) : null,
    estimatedTime: j.estimated_time,
    createdAt: j.created_at,
    assignedMechanicId: j.assigned_mechanic_id,
    mechanicName,
    customer: {
      id: j.customers?.id ?? null,
      name: j.customers?.users?.name ?? 'Unknown',
      email: j.customers?.users?.email ?? null,
      phone: j.customers?.phone ?? null,
      userId: j.customers?.user_id ?? null,
    },
    vehicle: j.vehicles
      ? {
          id: j.vehicles.id,
          make: j.vehicles.make,
          model: j.vehicles.model,
          year: j.vehicles.year,
          vin: j.vehicles.vin,
          label: vehicleLabel,
        }
      : null,
    vehicleLabel,
    damageReports: (j.damage_reports || []).map((d) => ({
      id: d.id,
      imageUrl: d.image_url,
      severity: d.severity,
      notes: d.notes,
      createdAt: d.created_at,
    })),
  };
}

/** Staff / detail API — null if not found */
export const getJobDetailById = async (id) => {
  const j = await jobRepo.getJobById(id);
  if (!j) return null;
  const mechanicName = await mechanicNameForJob(j.assigned_mechanic_id);
  return serializeJobDetail(j, mechanicName);
};

/** Portal — jobs linked via customers.user_id */
export const listPortalJobsForUser = async (userId) => {
  const cust = await prisma.customers.findMany({
    where: { user_id: userId },
    select: { id: true },
  });
  const cids = cust.map((c) => c.id);
  if (cids.length === 0) return [];

  const jobs = await prisma.jobs.findMany({
    where: { customer_id: { in: cids } },
    include: {
      customers: {
        include: { users: { select: { id: true, name: true, email: true } } },
      },
      vehicles: { select: { id: true, make: true, model: true, year: true, vin: true } },
    },
    orderBy: { created_at: 'desc' },
    take: 50,
  });

  const mechIds = [...new Set(jobs.map((j) => j.assigned_mechanic_id).filter(Boolean))];
  const mechanics =
    mechIds.length === 0
      ? []
      : await prisma.mechanics.findMany({
          where: { id: { in: mechIds } },
          include: { users: { select: { name: true } } },
        });
  const mechMap = Object.fromEntries(
    mechanics.map((m) => [m.id, m.users?.name ?? null])
  );

  return jobs.map((j) => {
    const mechanicName = j.assigned_mechanic_id ? mechMap[j.assigned_mechanic_id] ?? null : null;
    const row = { ...j, damage_reports: [] };
    const full = serializeJobDetail(row, mechanicName);
    return {
      id: full.id,
      status: full.status,
      estimatedCost: full.estimatedCost,
      estimatedTime: full.estimatedTime,
      createdAt: full.createdAt,
      vehicleLabel: full.vehicleLabel,
      mechanicName: full.mechanicName,
    };
  });
};

/** Portal — single job if customer owns it */
export const getPortalJobForUser = async (jobId, userId) => {
  const j = await jobRepo.getJobById(jobId);
  if (!j?.customers || j.customers.user_id !== userId) return null;
  const mechanicName = await mechanicNameForJob(j.assigned_mechanic_id);
  return serializeJobDetail(j, mechanicName);
};

export const getJobs = async () => {
  const jobs = await jobRepo.getAllJobs();
  return jobs.map(j => ({
    id: j.id,
    customer: j.customers?.users?.name || 'Unknown',
    vehicle: j.vehicles ? `${j.vehicles.year} ${j.vehicles.make} ${j.vehicles.model}` : 'Unknown',
    status: j.status,
    estimatedCost: j.estimated_cost || 0,
    created: j.created_at
  }));
};

export const createJob = async (data) => {
  const { customerId, vehicleId, mechanicId, status, estimatedCost, actorId } = data;
  const job = await prisma.jobs.create({
    data: {
      id: uuidv4(),
      customer_id: customerId,
      vehicle_id: vehicleId,
      assigned_mechanic_id: mechanicId,
      status: status || 'pending',
      estimated_cost: parseFloat(estimatedCost) || 0
    }
  });
  logAudit({ userId: actorId, action: 'CREATE', entity: 'job', entityId: job.id });
  return job;
};

export const deleteJob = async (id) => {
  // Check if AI predictions exist and delete them to avoid foreign key issues
  await prisma.ai_predictions.deleteMany({ where: { job_id: id } });
  return prisma.jobs.delete({ where: { id } });
};

export const updateJob = async (id, data) => {
  const { customerId, vehicleId, mechanicId, status, estimatedCost, actorId } = data;
  const job = await prisma.jobs.update({
    where: { id },
    data: {
      ...(customerId && { customer_id: customerId }),
      ...(vehicleId && { vehicle_id: vehicleId }),
      ...(mechanicId && { assigned_mechanic_id: mechanicId }),
      ...(status && { status }),
      ...(estimatedCost && { estimated_cost: parseFloat(estimatedCost) }),
    }
  });
  logAudit({ userId: actorId, action: status ? `STATUS:${status.toUpperCase()}` : 'UPDATE', entity: 'job', entityId: id });
  return job;
};
