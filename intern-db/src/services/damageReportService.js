import * as damageRepo from '@/repositories/damageReportRepository';

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const analyzeAndSaveDamageReport = async ({ jobId, imageBuffer, mimeType, filename }) => {
  // Call YOLOv8 on the AI microservice
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: mimeType });
  formData.append('image', blob, filename);

  const aiRes = await fetch(`${AI_URL}/predict-damage`, {
    method: 'POST',
    body: formData,
  });

  if (!aiRes.ok) {
    const err = await aiRes.text();
    throw new Error(`AI damage detection failed: ${err}`);
  }

  const aiData = await aiRes.json();
  // severity_score is 0–1 from AI; store as 0–10 in DB
  const severityDb = Math.round(aiData.severity_score * 10);

  const notesLines = aiData.detections.map(
    d => `${d.class} (conf: ${(d.confidence * 100).toFixed(0)}%)`
  );
  const notes = notesLines.length
    ? `Detected: ${notesLines.join(', ')}`
    : 'No damage detected';

  const report = await damageRepo.createDamageReport({
    jobId,
    imageUrl: aiData.filename || filename,
    severity: severityDb,
    notes,
    detections: aiData.detections,
  });

  return {
    ...report,
    ai: {
      detections: aiData.detections,
      detection_count: aiData.detection_count,
      severity_score: aiData.severity_score,
    }
  };
};

export const getDamageReportsByJobId = async (jobId) => {
  return damageRepo.findDamageReportsByJobId(jobId);
};
