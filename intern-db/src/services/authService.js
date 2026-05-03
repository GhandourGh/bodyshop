import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { authenticator } from 'otplib';
import { logAudit } from '@/services/auditService';
import { config } from '@/lib/config';
import prisma from '@/lib/db';
import {
  findUserByEmail,
  createUser,
  findCredentialUserByEmail,
  findCredentialUserById,
  updateUserById,
} from '@/repositories/userRepository';
import * as passwordResetRepo from '@/repositories/passwordResetRepository';
import { sendMail } from '@/lib/mail';
import { checkForgotPasswordRateLimit } from '@/lib/forgotPasswordRateLimit';

const SALT_ROUNDS = 12;
const RESET_TOKEN_BYTES = 32;
const RESET_EXPIRY_HOURS = 1;

function signSessionUser(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

function signTotpPending(user) {
  return jwt.sign(
    { purpose: 'totp_pending', id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.totpPendingExpiresIn }
  );
}

function stripSecrets(user) {
  const { password_hash: _p, totp_secret: _t, ...safe } = user;
  return safe;
}

/**
 * Register a new user.
 * @param {{ email: string, password: string, name?: string, role?: string }} data
 */
export const registerUser = async ({ email, password, name = 'New User', role = 'customer' }) => {
  const existing = await findUserByEmail(email);
  if (existing) {
    const err = new Error('Email already in use');
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await createUser({
    email,
    password_hash: hashedPassword,
    name,
    role,
  });

  const r = (role || 'customer').toLowerCase();
  if (r === 'customer') {
    await prisma.customers.create({
      data: { id: uuidv4(), user_id: user.id, phone: null },
    });
  }

  return user;
};

/**
 * Login: password check; if TOTP enabled return pending token instead of session JWT.
 * @param {{ email: string, password: string }} data
 */
export const loginUser = async ({ email, password }) => {
  const user = await findCredentialUserByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  if (user.totp_enabled && user.totp_secret) {
    const pendingToken = signTotpPending(user);
    return {
      step: 'totp_required',
      pendingToken,
      user: stripSecrets(user),
    };
  }

  const token = signSessionUser(user);
  logAudit({ userId: user.id, action: 'LOGIN', entity: 'user', entityId: user.id });
  return { token, user: stripSecrets(user) };
};

/**
 * @param {{ pendingToken: string, code: string }} data
 */
export const completeTotpLogin = async ({ pendingToken, code }) => {
  let decoded;
  try {
    decoded = jwt.verify(pendingToken, config.jwtSecret);
  } catch {
    const err = new Error('Invalid or expired login session. Please sign in again.');
    err.statusCode = 401;
    throw err;
  }

  if (decoded.purpose !== 'totp_pending' || !decoded.email) {
    const err = new Error('Invalid login session');
    err.statusCode = 400;
    throw err;
  }

  const user = await findCredentialUserByEmail(decoded.email);
  if (!user || !user.totp_enabled || !user.totp_secret) {
    const err = new Error('Two-factor authentication is not active for this account');
    err.statusCode = 400;
    throw err;
  }

  const valid = authenticator.verify({ token: String(code).replace(/\s/g, ''), secret: user.totp_secret });
  if (!valid) {
    const err = new Error('Invalid authenticator code');
    err.statusCode = 401;
    throw err;
  }

  const token = signSessionUser(user);
  return { token, user: stripSecrets(user) };
};

/**
 * Always succeeds from caller POV (no email enumeration).
 * @param {string} email
 */
export const requestPasswordReset = async (email) => {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    return { ok: true };
  }

  if (!checkForgotPasswordRateLimit(normalized)) {
    return { ok: true };
  }

  const user = await findUserByEmail(normalized);
  if (!user) {
    return { ok: true };
  }

  const raw = crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000);

  await passwordResetRepo.deleteTokensForUser(user.id);
  await passwordResetRepo.createResetToken(user.id, tokenHash, expiresAt);

  const url = `${config.frontendUrl}/reset-password?token=${encodeURIComponent(raw)}`;
  const sent = await sendMail({
    to: user.email,
    subject: 'Reset your AutoForge password',
    text: `Hi${user.name ? ` ${user.name}` : ''},\n\nReset your password (link valid ${RESET_EXPIRY_HOURS} hour(s)):\n${url}\n\nIf you did not request this, ignore this email.`,
    html: `<p>Hi${user.name ? ` ${user.name}` : ''},</p><p>Reset your password (link valid <strong>${RESET_EXPIRY_HOURS}</strong> hour(s)):</p><p><a href="${url}">Set a new password</a></p><p style="color:#64748b;font-size:12px">If you did not request this, ignore this email.</p>`,
  });

  if (!sent.ok && config.nodeEnv !== 'development') {
    const err = new Error(sent.error || 'Could not send reset email');
    err.statusCode = 500;
    throw err;
  }

  return { ok: true, devLink: sent.devLink };
};

/**
 * @param {{ token: string, password: string }} data
 */
export const resetPasswordWithToken = async ({ token, password }) => {
  if (!token || !password || password.length < 8) {
    const err = new Error('Invalid token or password too short (min 8 characters)');
    err.statusCode = 400;
    throw err;
  }

  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
  const row = await passwordResetRepo.findValidToken(tokenHash);
  if (!row || !row.users) {
    const err = new Error('Invalid or expired reset link');
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  await updateUserById(row.user_id, { password_hash: hashedPassword });
  await passwordResetRepo.deleteTokenById(row.id);
  return { ok: true };
};

/**
 * @param {string} userId
 */
export const totpSetup = async (userId) => {
  const user = await findCredentialUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(user.email, 'AutoForge', secret);
  return { secret, otpauthUrl };
};

/**
 * @param {string} userId
 * @param {string} secret — from setup step, not yet stored
 * @param {string} code — 6-digit TOTP
 */
export const totpEnable = async (userId, secret, code) => {
  const clean = String(code).replace(/\s/g, '');
  const valid = authenticator.verify({ token: clean, secret });
  if (!valid) {
    const err = new Error('Invalid code — check your authenticator app time sync');
    err.statusCode = 400;
    throw err;
  }

  await updateUserById(userId, { totp_secret: secret, totp_enabled: true });
  const user = await findCredentialUserById(userId);
  return { user: stripSecrets(user) };
};

/**
 * @param {string} userId
 * @param {string} password
 * @param {string} [code] — required when TOTP is enabled
 */
export const totpDisable = async (userId, password, code) => {
  const user = await findCredentialUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  if (!user.totp_enabled || !user.totp_secret) {
    const err = new Error('Two-factor authentication is not enabled');
    err.statusCode = 400;
    throw err;
  }

  const pwOk = await bcrypt.compare(password, user.password_hash);
  if (!pwOk) {
    const err = new Error('Invalid password');
    err.statusCode = 401;
    throw err;
  }

  const clean = String(code || '').replace(/\s/g, '');
  if (!clean) {
    const err = new Error('Authenticator code required to disable 2FA');
    err.statusCode = 400;
    throw err;
  }
  const valid = authenticator.verify({ token: clean, secret: user.totp_secret });
  if (!valid) {
    const err = new Error('Invalid authenticator code');
    err.statusCode = 401;
    throw err;
  }

  await updateUserById(userId, { totp_secret: null, totp_enabled: false });
  return { ok: true };
};
