import * as jobRepo from '@/repositories/jobRepository';
import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

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
  const { customerId, vehicleId, mechanicId, status, estimatedCost } = data;
  return prisma.jobs.create({
    data: {
      id: uuidv4(),
      customer_id: customerId,
      vehicle_id: vehicleId,
      assigned_mechanic_id: mechanicId,
      status: status || 'pending',
      estimated_cost: parseFloat(estimatedCost) || 0
    }
  });
};

export const deleteJob = async (id) => {
  // Check if AI predictions exist and delete them to avoid foreign key issues
  await prisma.ai_predictions.deleteMany({ where: { job_id: id } });
  return prisma.jobs.delete({ where: { id } });
};

export const updateJob = async (id, data) => {
  const { customerId, vehicleId, mechanicId, status, estimatedCost } = data;
  return prisma.jobs.update({
    where: { id },
    data: {
      ...(customerId && { customer_id: customerId }),
      ...(vehicleId && { vehicle_id: vehicleId }),
      ...(mechanicId && { assigned_mechanic_id: mechanicId }),
      ...(status && { status }),
      ...(estimatedCost && { estimated_cost: parseFloat(estimatedCost) }),
    }
  });
};
