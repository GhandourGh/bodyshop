import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const createDamageReport = async ({ jobId, imageUrl, severity, notes, detections }) => {
  return prisma.damage_reports.create({
    data: {
      id: uuidv4(),
      job_id: jobId,
      image_url: imageUrl || null,
      severity: Math.round(severity),   // store 0–10 int
      notes: notes || null,
    }
  });
};

export const findDamageReportsByJobId = async (jobId) => {
  return prisma.damage_reports.findMany({
    where: { job_id: jobId },
    orderBy: { created_at: 'desc' }
  });
};
