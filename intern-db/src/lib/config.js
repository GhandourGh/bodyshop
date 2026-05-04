/**
 * Environment variable validation.
 * Imported early — throws on startup if config is invalid.
 */

const REQUIRED = ['DATABASE_URL', 'JWT_SECRET'];

for (const key of REQUIRED) {
  if (!process.env[key]) {
    throw new Error(`[Config] Missing required environment variable: ${key}`);
  }
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error('[Config] JWT_SECRET must be at least 32 characters long');
}

export const config = {
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  /** Short-lived JWT after password OK, before TOTP (minutes). */
  totpPendingExpiresIn: process.env.TOTP_PENDING_EXPIRES_IN || '5m',
  databaseUrl: process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV || 'development',
  /** Vite app origin for password reset links (no trailing slash). */
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),
};
