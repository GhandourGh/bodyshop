import { getVehicles, createVehicle, deleteVehicle, updateVehicle } from '@/services/vehicleService';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const listVehicles = async (request) => {
  try {
    const data = await getVehicles();
    return successResponse(data, 'Vehicles retrieved successfully');
  } catch (err) {
    return errorResponse(err.message, 500);
  }
};

export const addVehicle = async (request) => {
  try {
    const body = await request.json();
    const data = await createVehicle(body);
    return successResponse(data, 'Vehicle created', 201);
  } catch (err) {
    return errorResponse(err.message, 400);
  }
};

export const removeVehicle = async (id) => {
  try {
    await deleteVehicle(id);
    return successResponse(null, 'Vehicle deleted');
  } catch (err) {
    return errorResponse(err.message, 400);
  }
};

export const editVehicle = async (id, request) => {
  try {
    const body = await request.json();
    const data = await updateVehicle(id, body);
    return successResponse(data, 'Vehicle updated');
  } catch (err) {
    return errorResponse(err.message, 400);
  }
};
