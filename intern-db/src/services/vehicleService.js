import * as vehicleRepo from '@/repositories/vehicleRepository';
import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const getVehicles = async () => {
  const vehicles = await vehicleRepo.getAllVehicles();
  return vehicles.map(v => ({
    id: v.id,
    vin: v.vin,
    make: v.make,
    model: v.model,
    year: v.year,
    owner: v.customers?.users?.name || 'Unknown',
    ownerId: v.customer_id
  }));
};

export const createVehicle = async (data) => {
  const { vin, make, model, year, customerId } = data;
  return prisma.vehicles.create({
    data: {
      id: uuidv4(),
      vin,
      make,
      model,
      year: parseInt(year),
      customer_id: customerId
    }
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
      ...(vin && { vin }),
      ...(make && { make }),
      ...(model && { model }),
      ...(year && { year: parseInt(year) }),
      ...(customerId && { customer_id: customerId }),
    }
  });
};
