import { getMechanics, deleteMechanic } from '@/services/mechanicService';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const listMechanics = async (request) => {
  try {
    const data = await getMechanics();
    return successResponse(data, 'Mechanics retrieved successfully');
  } catch (err) {
    return errorResponse(err.message, 500);
  }
};

export const removeMechanic = async (id) => {
  try {
    await deleteMechanic(id);
    return successResponse(null, 'Mechanic deleted');
  } catch (err) {
    return errorResponse(err.message, 400);
  }
};
