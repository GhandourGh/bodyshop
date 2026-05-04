import crypto from 'crypto';
import { config } from '@/lib/config';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function deriveKey() {
  const master = process.env.CREDENTIALS_MASTER_KEY || config.jwtSecret || 'dev-only-change-me';
  return crypto.createHash('sha256').update(master, 'utf8').digest();
}

/**
 * @param {string} plaintext
 * @returns {string} base64(iv+ciphertext+tag)
 */
export function encryptSecret(plaintext) {
  const key = deriveKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: TAG_LEN });
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, enc, tag]).toString('base64');
}

/**
 * @param {string} blob base64 from encryptSecret
 * @returns {string}
 */
export function decryptSecret(blob) {
  const raw = Buffer.from(blob, 'base64');
  const iv = raw.subarray(0, IV_LEN);
  const tag = raw.subarray(raw.length - TAG_LEN);
  const data = raw.subarray(IV_LEN, raw.length - TAG_LEN);
  const key = deriveKey();
  const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: TAG_LEN });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
