import { getPredictions, processAi } from '@/services/aiService';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const listPredictions = async (request) => {
  try {
    const data = await getPredictions();
    return successResponse(data, 'AI predictions retrieved successfully');
  } catch (err) {
    return errorResponse(err.message, 500);
  }
};

export const triggerAi = async (request) => {
  try {
    const body = await request.json();
    const { jobId, type } = body;
    const data = await processAi(jobId, type);
    return successResponse(data, 'AI analysis complete');
  } catch (err) {
    return errorResponse(err.message, 500);
  }
};
