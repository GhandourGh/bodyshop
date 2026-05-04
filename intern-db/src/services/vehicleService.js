import * as vehicleRepo from '@/repositories/vehicleRepository';
import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const getVehicles = async () => {
  const vehicles = await vehicleRepo.getAllVehicles();
  return vehicles.map((v) => {
    const ownerName = v.customers?.users?.name || null;
    return {
      id: v.id,
      vin: v.vin,
      make: v.make,
      model: v.model,
      year: v.year,
      ownerId: v.customer_id,
      owner: ownerName || 'Unassigned',
      customers: v.customers
        ? {
            id: v.customers.id,
            name: ownerName,
            users: v.customers.users ? { name: v.customers.users.name } : null,
          }
        : null,
      jobs: (v.jobs || []).map((j) => ({
        id: j.id,
        status: j.status,
      })),
    };
  });
};

export const createVehicle = async (data) => {
  const { vin, make, model, year, customerId } = data;
  return prisma.vehicles.create({
    data: {
      id: uuidv4(),
      vin,
      make,
      model,
      year: year != null && year !== '' ? parseInt(year) : null,
      customer_id: customerId,
    },
  });
};

export const deleteVehicle = async (id) => {
  return prisma.vehicles.delete({ where: { id } });
};

export const updateVehicle = async (id, data) => {
  const { vin, make, model, year, customerId } = data;
  return prisma.vehicles.update({
    where: { id },
    data: {
      ...(vin !== undefined && { vin }),
      ...(make !== undefined && { make }),
      ...(model !== undefined && { model }),
      ...(year !== undefined && year !== '' && { year: parseInt(year) }),
      ...(customerId !== undefined && { customer_id: customerId }),
    },
  });
};
