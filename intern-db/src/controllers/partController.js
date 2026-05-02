import { getParts, createPart, deletePart, updatePart } from '@/services/partService';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const listParts = async (request) => {
  try {
    const data = await getParts();
    return successResponse(data, 'Parts retrieved successfully');
  } catch (err) {
    return errorResponse(err.message, 500);
  }
};

export const addPart = async (request) => {
  try {
    const body = await request.json();
    const data = await createPart(body);
    return successResponse(data, 'Part created', 201);
  } catch (err) {
    return errorResponse(err.message, 400);
  }
};

export const removePart = async (id) => {
  try {
    await deletePart(id);
    return successResponse(null, 'Part deleted');
  } catch (err) {
    return errorResponse(err.message, 400);
  }
};

export const editPart = async (id, request) => {
  try {
    const body = await request.json();
    const data = await updatePart(id, body);
    return successResponse(data, 'Part updated');
  } catch (err) {
    return errorResponse(err.message, 400);
  }
};
