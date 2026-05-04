import nodemailer from 'nodemailer';
import { config } from '@/lib/config';

/**
 * @returns {import('nodemailer').Transporter | null}
 */
function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user) return null;

  return nodemailer.createTransport({
    host,
    port: port || (secure ? 465 : 587),
    secure,
    auth: { user, pass: pass || '' },
  });
}

/**
 * @param {{ to: string, subject: string, text: string, html?: string }} opts
 * @returns {Promise<{ ok: boolean, devLink?: string, error?: string }>}
 */
export async function sendMail({ to, subject, text, html }) {
  const transport = createTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@autoforge.local';

  if (!transport) {
    if (config.nodeEnv === 'development') {
      const devLink = text.match(/https?:\/\/[^\s]+/)?.[0];
      console.warn('[mail] SMTP not configured — would send to', to, '\n', text);
      return { ok: true, devLink };
    }
    return { ok: false, error: 'SMTP is not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS)' };
  }

  try {
    await transport.sendMail({
      from,
      to,
      subject,
      text,
      html: html || text,
    });
    return { ok: true };
  } catch (e) {
    console.error('[mail] send failed', e);
    return { ok: false, error: e.message || 'Send failed' };
  }
}
