import { getFinanceSummary } from '@/services/financeService';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const financeSummary = async () => {
  try {
    const data = await getFinanceSummary();
    return successResponse(data, 'Finance summary retrieved');
  } catch (err) {
    return errorResponse(err.message, 500);
  }
};
