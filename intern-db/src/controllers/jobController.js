import { getJobs, createJob, deleteJob, updateJob } from '@/services/jobService';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const listJobs = async (request) => {
  try {
    const data = await getJobs();
    return successResponse(data, 'Jobs retrieved successfully');
  } catch (err) {
    return errorResponse(err.message, 500);
  }
};

export const addJob = async (request) => {
  try {
    const body = await request.json();
    const data = await createJob(body);
    return successResponse(data, 'Job created', 201);
  } catch (err) {
    return errorResponse(err.message, 400);
  }
};

export const removeJob = async (id) => {
  try {
    await deleteJob(id);
    return successResponse(null, 'Job deleted');
  } catch (err) {
    return errorResponse(err.message, 400);
  }
};

export const editJob = async (id, request) => {
  try {
    const body = await request.json();
    const data = await updateJob(id, body);
    return successResponse(data, 'Job updated');
  } catch (err) {
    return errorResponse(err.message, 400);
  }
};
