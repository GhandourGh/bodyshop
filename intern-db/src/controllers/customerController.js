import { getCustomers } from '@/services/customerService';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const listCustomers = async (request) => {
  try {
    const data = await getCustomers();
    return successResponse(data, 'Customers retrieved successfully');
  } catch (err) {
    return errorResponse(err.message, 500);
  }
};
