export const dynamic = 'force-dynamic';
import { authenticate } from '@/middlewares/authMiddleware';
import { analyzeAndSaveDamageReport } from '@/services/damageReportService';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export async function POST(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  try {
    const formData = await request.formData();
    const jobId = formData.get('jobId');
    const imageFile = formData.get('image');

    if (!jobId) return errorResponse('jobId is required', 400);
    if (!imageFile) return errorResponse('image file is required', 400);

    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const report = await analyzeAndSaveDamageReport({
      jobId,
      imageBuffer,
      mimeType: imageFile.type,
      filename: imageFile.name,
    });

    return successResponse(report, 'Damage report created', 201);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
