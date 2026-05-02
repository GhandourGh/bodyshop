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
  databaseUrl: process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV || 'development',
};
