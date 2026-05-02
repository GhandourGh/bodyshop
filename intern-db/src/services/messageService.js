import * as messageRepo from '@/repositories/messageRepository';

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const createMessage = async ({ jobId, userId, messageType, customerName, jobDetails, language, channel }) => {
  // Generate message content via Groq LLaMA on the AI microservice
  const aiRes = await fetch(`${AI_URL}/generate-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message_type: messageType || 'status_update',
      customer_name: customerName,
      job_details: jobDetails,
      language: language || 'en',
    }),
  });

  if (!aiRes.ok) throw new Error('AI message generation failed');
  const aiData = await aiRes.json();

  return messageRepo.createMessage({
    jobId,
    userId,
    channel: channel || 'email',
    content: aiData.message,
  });
};

export const getMessagesByJobId = async (jobId) => {
  const messages = await messageRepo.findMessagesByJobId(jobId);
  return messages.map(m => ({
    id: m.id,
    jobId: m.job_id,
    sender: m.users?.name || 'System',
    role: m.users?.role || 'system',
    channel: m.channel,
    content: m.content,
    created: m.created_at,
  }));
};
