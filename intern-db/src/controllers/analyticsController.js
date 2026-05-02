import { getOverviewStats } from '@/services/analyticsService';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const getOverview = async (request) => {
  try {
    const data = await getOverviewStats();
    return successResponse(data, 'Overview stats retrieved');
  } catch (err) {
    return errorResponse(err.message, 500);
  }
};
